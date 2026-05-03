"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChevronDownIcon, XIcon } from "@/components/Icon";
import { SlashMenu } from "@/components/SlashMenu";
import { useAdminMode } from "@/hooks/useAdminMode";
import {
  SAMPLE_ANSWER,
  SAMPLE_DEFERRAL,
  SAMPLE_QUESTION,
  STREAMING_RETRIEVAL,
} from "@/lib/mock-data";
import { addRecent } from "@/lib/recents";
import type { Answer, AskState, Deferral, RetrievalStep, SlashCommand } from "@/types";

import { AnsweredView } from "./AnsweredView";
import { AskInput } from "./AskInput";
import { DemoStateBar } from "./DemoStateBar";
import { LowConfidenceView } from "./LowConfidenceView";
import { Retrieval } from "./Retrieval";
import { DEFAULT_SOURCE_MODE, SourceMode, type SourceModeValue } from "./SourceMode";
import { StreamingAnswer } from "./StreamingAnswer";

type DemoState = Extract<AskState, "input" | "streaming" | "answered" | "low">;

type AskHistoryEntry = {
  id: string;
  question: string;
  result: { kind: "answer"; answer: Answer } | { kind: "deferral"; deferral: Deferral };
  timestamp: number;
};

const SCOPE = "Ad-Ḍuḥā 93:1–11";

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function questionFor(state: DemoState): string {
  if (state === "input") return "";
  return state === "low" ? SAMPLE_DEFERRAL.question : SAMPLE_QUESTION;
}

function getRetrievalSteps(state: DemoState): readonly RetrievalStep[] {
  if (state === "input") return [];
  if (state === "streaming") return STREAMING_RETRIEVAL;
  if (state === "low") return SAMPLE_DEFERRAL.retrieval;
  return SAMPLE_ANSWER.retrieval;
}

/**
 * Top-level Ask screen. v3 default state is "input" — empty textarea, no
 * answer rendered. Streaming/answered/low are reachable via the demo bar
 * (admin only) and via Submit. The demo bar is hidden from non-admin users.
 *
 * Resolves the Wave 2E TODO: rebuilds the input → streaming → answered flow
 * with a real follow-up action, session-scoped Q&A history, the locked
 * Sources surface, the collapsing retrieval pipeline, and the portaled
 * citation hover-card.
 */
export function Ask() {
  const searchParams = useSearchParams();
  const { admin } = useAdminMode();

  const initialQuery = searchParams?.get("q") ?? "";
  const [state, setState] = useState<DemoState>("input");
  const [question, setQuestion] = useState<string>(initialQuery);
  // Track the last "canonical" sample value so we know when to overwrite
  // user input vs. preserve it. Switching demo state via the demo bar
  // refreshes the textarea; switching by clicking Ask/Stop does not.
  const [lastSampleSource, setLastSampleSource] = useState<DemoState>("input");
  const [history, setHistory] = useState<readonly AskHistoryEntry[]>([]);
  const [sourceMode, setSourceMode] = useState<SourceModeValue>(DEFAULT_SOURCE_MODE);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Mirror the textarea node in state so the SlashMenu's anchor prop is a
  // proper React-tracked dependency rather than a render-time ref read
  // (which the React 19 lint rules forbid).
  const [textareaEl, setTextareaEl] = useState<HTMLTextAreaElement | null>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");

  // Combined ref: hold a stable RefObject for our own imperative reads, AND
  // capture the element into local state for the SlashMenu anchor prop.
  const setCombinedTextareaRef = useCallback((node: HTMLTextAreaElement | null) => {
    textareaRef.current = node;
    setTextareaEl(node);
  }, []);

  const handleDemoStateChange = useCallback((next: DemoState) => {
    setState(next);
    setQuestion(questionFor(next));
    setLastSampleSource(next);
  }, []);

  const handleSubmit = useCallback(() => {
    setState("streaming");
    addRecent(question, "/ask");
  }, [question]);

  const handleStop = useCallback(() => {
    setState("answered");
  }, []);

  // Follow-up: collapse current Q&A into a history entry, prepend it, then
  // reset the input + state. The previous answer scrolls up into the
  // history list and stays accessible there.
  const handleFollowUp = useCallback(() => {
    const entry: AskHistoryEntry = {
      id: makeId(),
      question: questionFor("answered"),
      result: { kind: "answer", answer: SAMPLE_ANSWER },
      timestamp: Date.now(),
    };
    setHistory((prev) => [entry, ...prev]);
    setState("input");
    setQuestion("");
    setLastSampleSource("input");
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Slash-menu detection — the editor is a plain textarea so we listen for
  // `/` at the start of the line or after whitespace, then track the query
  // until space/escape/select.
  const handleKeyDownExtra = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const target = event.currentTarget;
      const caret = target.selectionStart ?? 0;
      const before = target.value.slice(0, caret);
      const charBefore = before.slice(-1);
      if (event.key === "/" && (caret === 0 || /\s/.test(charBefore))) {
        // Allow the slash to be typed normally; flip the menu open on next
        // tick so the input value already includes the slash.
        setSlashQuery("");
        setSlashOpen(true);
        return;
      }
      if (slashOpen) {
        // While the menu is open, Enter / ArrowUp / ArrowDown belong to the
        // SlashMenu — preventDefault here so AskInput doesn't also submit.
        if (event.key === "Enter" || event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          return;
        }
        if (event.key === " " || event.key === "Escape") {
          setSlashOpen(false);
        }
      }
    },
    [slashOpen],
  );

  // Update slash query as the user keeps typing after `/`. Reads the textarea
  // value directly because the keydown is raised before the value updates.
  useEffect(() => {
    if (!slashOpen) return;
    const node = textareaRef.current;
    if (!node) return;
    function onInput() {
      if (!node) return;
      const caret = node.selectionStart ?? 0;
      const value = node.value;
      // Find the most-recent slash before the caret that is at start-of-line
      // or after whitespace.
      let slashIndex = -1;
      for (let i = caret - 1; i >= 0; i -= 1) {
        const ch = value[i];
        if (ch === "/") {
          if (i === 0 || /\s/.test(value[i - 1] ?? "")) {
            slashIndex = i;
          }
          break;
        }
        if (ch === undefined || /\s/.test(ch)) break;
      }
      if (slashIndex === -1) {
        setSlashOpen(false);
        return;
      }
      setSlashQuery(value.slice(slashIndex + 1, caret));
    }
    node.addEventListener("input", onInput);
    return () => node.removeEventListener("input", onInput);
  }, [slashOpen]);

  const handleSlashSelect = useCallback((cmd: SlashCommand) => {
    const node = textareaRef.current;
    setSlashOpen(false);
    setSlashQuery("");
    if (!node) return;
    const value = node.value;
    const caret = node.selectionStart ?? value.length;
    // Find the slash trigger position so we can replace `/<query>` with
    // `/<trigger> ` (or, for /search, immediately submit the rest as-is).
    let slashIndex = -1;
    for (let i = caret - 1; i >= 0; i -= 1) {
      const ch = value[i];
      if (ch === "/") {
        if (i === 0 || /\s/.test(value[i - 1] ?? "")) {
          slashIndex = i;
        }
        break;
      }
      if (ch === undefined || /\s/.test(ch)) break;
    }
    if (slashIndex === -1) {
      return;
    }
    if (cmd.id === "search") {
      // Strip the slash + query, keep whatever else is in the box, submit.
      const stripped = (value.slice(0, slashIndex) + value.slice(caret)).trim();
      const finalQuestion = stripped.length > 0 ? stripped : "";
      setQuestion(finalQuestion);
      if (finalQuestion.length > 0) {
        addRecent(finalQuestion, "/ask");
      }
      setState("streaming");
      return;
    }
    // /ayah — drop in the trigger so the user can keep typing the ref.
    const replaced = value.slice(0, slashIndex) + `/${cmd.trigger} ` + value.slice(caret);
    setQuestion(replaced);
    // Restore caret position to right after the inserted trigger + space.
    const nextCaret = slashIndex + cmd.trigger.length + 2;
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(nextCaret, nextCaret);
    });
  }, []);

  // Read-only view of the canonical question for the current demo state
  // — used for the "Your question" header so it doesn't drift when the
  // user is mid-edit.
  const displayQuestion = state === lastSampleSource ? questionFor(state) : question;

  const showAnswerSurface = state !== "input";

  const historyView = useMemo(
    () =>
      history.length === 0 ? null : (
        <div className="ask-history" style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-ink-4)",
              }}
            >
              Session history
            </span>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={handleClearHistory}
              className="btn ghost sm"
              aria-label="Clear session history"
            >
              <XIcon size={11} /> Clear history
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((entry) => (
              <details
                key={entry.id}
                style={{
                  border: "1px solid var(--color-line)",
                  borderRadius: "var(--radius)",
                  background: "var(--color-bg-elev)",
                  padding: "8px 12px",
                  fontSize: 12.5,
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--color-ink-2)",
                    listStyle: "none",
                  }}
                >
                  <ChevronDownIcon size={11} />
                  <span style={{ flex: 1 }}>{entry.question}</span>
                </summary>
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid var(--color-line)",
                    color: "var(--color-ink-3)",
                    fontFamily: "var(--font-serif)",
                    lineHeight: 1.55,
                  }}
                >
                  {entry.result.kind === "answer"
                    ? entry.result.answer.paragraphs.map((paragraph, index) => (
                        <p key={index} style={{ marginBottom: 8 }}>
                          {paragraph.segments.map((segment, segIndex) => (
                            <span key={segIndex}>{segment.value}</span>
                          ))}
                        </p>
                      ))
                    : entry.result.deferral.body.map((line, index) => (
                        <p key={index} style={{ marginBottom: 8 }}>
                          {line.replace(/\*\*/g, "").replace(/\*/g, "")}
                        </p>
                      ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      ),
    [history, handleClearHistory],
  );

  return (
    <div className="ask-screen">
      <div className="ask-inner">
        {historyView}

        <AskInput
          ref={setCombinedTextareaRef}
          state={state === "input" ? "idle" : state}
          value={question}
          scope={SCOPE}
          onChange={setQuestion}
          onSubmit={handleSubmit}
          onStop={handleStop}
          onKeyDownExtra={handleKeyDownExtra}
        />

        <SourceMode value={sourceMode} onChange={setSourceMode} />

        {showAnswerSurface ? (
          <>
            <div className="answer">
              <span className="q-label">Your question</span>
              <div className="q-text">{displayQuestion}</div>
            </div>

            <Retrieval
              steps={getRetrievalSteps(state)}
              collapsedByDefault={state === "answered"}
              durationMs={state === "answered" ? SAMPLE_ANSWER.durationMs : undefined}
            />
          </>
        ) : null}

        {state === "streaming" && <StreamingAnswer />}
        {state === "answered" && (
          <AnsweredView answer={SAMPLE_ANSWER} onFollowUp={handleFollowUp} />
        )}
        {state === "low" && <LowConfidenceView />}

        {admin ? <DemoStateBar state={state} onChange={handleDemoStateChange} /> : null}

        <SlashMenu
          anchor={textareaEl}
          open={slashOpen}
          query={slashQuery}
          onSelect={handleSlashSelect}
          onClose={() => setSlashOpen(false)}
          allowedIds={["search", "ayah"]}
        />
      </div>
    </div>
  );
}
