"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChevronDownIcon, XIcon } from "@/components/Icon";
import { SlashMenu } from "@/components/SlashMenu";
import { useAdminMode } from "@/hooks/useAdminMode";
import {
  ASK_SCENARIOS,
  STREAMING_RETRIEVAL,
  defaultVariantFor,
  findScenario,
} from "@/lib/mock-data";
import { addRecent } from "@/lib/recents";
import type {
  Answer,
  AskScenario,
  AskScenarioVariant,
  AskState,
  Deferral,
  RetrievalStep,
  SlashCommand,
} from "@/types";

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

const SCOPE = "Aḍ-Ḍuḥā 93:1–11";
const FALLBACK_SCENARIO: AskScenario = (() => {
  const first = ASK_SCENARIOS[0];
  if (!first) throw new Error("ASK_SCENARIOS is empty");
  return first;
})();

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickAnswerVariant(scenario: AskScenario): AskScenarioVariant {
  const answerVariant = scenario.variants.find((v) => v.outcome.kind === "answer");
  return answerVariant ?? defaultVariantFor(scenario);
}

function pickDeferralVariant(scenario: AskScenario): AskScenarioVariant {
  const deferralVariant = scenario.variants.find((v) => v.outcome.kind === "deferral");
  return deferralVariant ?? defaultVariantFor(scenario);
}

function activeAnswer(variant: AskScenarioVariant): Answer | null {
  return variant.outcome.kind === "answer" ? variant.outcome.answer : null;
}

function activeDeferral(variant: AskScenarioVariant): Deferral | null {
  return variant.outcome.kind === "deferral" ? variant.outcome.deferral : null;
}

/**
 * Top-level Ask screen. v3 default state is "input" — empty textarea, no
 * answer rendered. Streaming/answered/low are reachable via the demo bar
 * (admin only) and via Submit. The demo bar is hidden from non-admin users.
 *
 * Scenario switching: the demo bar exposes a scenario + variant picker
 * (admin only) so QA can cycle through every authored scenario without
 * editing code. The default scenario is `ASK_SCENARIOS[0]` (the canonical
 * mā waddaʿaka reading); state changes (Input → Streaming → Answered)
 * pick a variant whose outcome matches the destination state.
 */
export function Ask() {
  const searchParams = useSearchParams();
  const { admin } = useAdminMode();

  const initialQuery = searchParams?.get("q") ?? "";
  const [state, setState] = useState<DemoState>("input");
  const [scenarioId, setScenarioId] = useState<string>(FALLBACK_SCENARIO.id);
  const [variantId, setVariantId] = useState<string>(() => pickAnswerVariant(FALLBACK_SCENARIO).id);

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

  const scenario = useMemo<AskScenario>(
    () => findScenario(scenarioId) ?? FALLBACK_SCENARIO,
    [scenarioId],
  );
  const variant = useMemo<AskScenarioVariant>(
    () => scenario.variants.find((v) => v.id === variantId) ?? defaultVariantFor(scenario),
    [scenario, variantId],
  );
  const answerForState = activeAnswer(variant);
  const deferralForState = activeDeferral(variant);

  // The `questionFor` helper picks the question string for a given demo
  // state — input shows nothing; streaming/answered show the variant's
  // canonical question; low shows the deferral variant's question.
  const questionFor = useCallback(
    (next: DemoState): string => {
      if (next === "input") return "";
      if (next === "low") {
        return activeDeferral(pickDeferralVariant(scenario))?.question ?? "";
      }
      return activeAnswer(pickAnswerVariant(scenario))?.question ?? "";
    },
    [scenario],
  );

  const handleDemoStateChange = useCallback(
    (next: DemoState) => {
      setState(next);
      setQuestion(questionFor(next));
      setLastSampleSource(next);
      // When entering low/answered/streaming, snap variantId to the
      // matching outcome so Retrieval / AnsweredView / LowConfidence read
      // the right shape.
      if (next === "low") {
        setVariantId(pickDeferralVariant(scenario).id);
      } else if (next === "answered" || next === "streaming") {
        setVariantId(pickAnswerVariant(scenario).id);
      }
    },
    [scenario, questionFor],
  );

  const handleScenarioChange = useCallback((id: string) => {
    setScenarioId(id);
    const next = findScenario(id);
    if (!next) return;
    // Default to an answer variant when switching scenarios — admin can
    // pick a deferral variant explicitly.
    const nextVariant = pickAnswerVariant(next);
    setVariantId(nextVariant.id);
    setQuestion(activeAnswer(nextVariant)?.question ?? "");
    setLastSampleSource((prev) => prev);
  }, []);

  const handleVariantChange = useCallback(
    (id: string) => {
      setVariantId(id);
      const nextVariant = scenario.variants.find((v) => v.id === id);
      if (!nextVariant) return;
      const outcome = nextVariant.outcome;
      if (outcome.kind === "answer") {
        setQuestion(outcome.answer.question);
        setState((prev) => (prev === "low" ? "answered" : prev));
      } else {
        setQuestion(outcome.deferral.question);
        setState("low");
      }
    },
    [scenario],
  );

  const handleSubmit = useCallback(() => {
    setState("streaming");
    setVariantId(pickAnswerVariant(scenario).id);
    addRecent(question, "/ask");
  }, [question, scenario]);

  const handleStop = useCallback(() => {
    setState("answered");
    setVariantId(pickAnswerVariant(scenario).id);
  }, [scenario]);

  // Follow-up: collapse current Q&A into a history entry, prepend it, then
  // reset the input + state. The previous answer scrolls up into the
  // history list and stays accessible there.
  const handleFollowUp = useCallback(() => {
    if (!answerForState) return;
    const entry: AskHistoryEntry = {
      id: makeId(),
      question: answerForState.question,
      result: { kind: "answer", answer: answerForState },
      timestamp: Date.now(),
    };
    setHistory((prev) => [entry, ...prev]);
    setState("input");
    setQuestion("");
    setLastSampleSource("input");
  }, [answerForState]);

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

  // Update slash query as the user keeps typing after `/`. Refs avoid
  // re-attaching the listener every time `slashOpen` flips: the listener is
  // attached once when the textarea node is captured, and gates its work on
  // the latest value of `slashOpen` via the ref.
  const slashOpenRef = useRef(slashOpen);
  useEffect(() => {
    slashOpenRef.current = slashOpen;
  }, [slashOpen]);

  useEffect(() => {
    const node = textareaEl;
    if (!node) return;
    function onInput() {
      if (!slashOpenRef.current) return;
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
  }, [textareaEl]);

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
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
        setVariantId(pickAnswerVariant(scenario).id);
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
    },
    [scenario],
  );

  // Read-only view of the canonical question for the current demo state
  // — used for the "Your question" header so it doesn't drift when the
  // user is mid-edit.
  const displayQuestion = state === lastSampleSource ? questionFor(state) : question;

  const showAnswerSurface = state !== "input";

  // Retrieval steps depend on state + active variant.
  const retrievalSteps: readonly RetrievalStep[] = useMemo(() => {
    if (state === "input") return [];
    if (state === "streaming") return STREAMING_RETRIEVAL;
    if (state === "low") return deferralForState?.retrieval ?? [];
    return answerForState?.retrieval ?? [];
  }, [state, answerForState, deferralForState]);

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
                        <p key={`${entry.id}-p-${index}`} style={{ marginBottom: 8 }}>
                          {paragraph.segments.map((segment, segIndex) => (
                            <span key={`${entry.id}-p-${index}-s-${segIndex}-${segment.kind}`}>
                              {segment.value}
                            </span>
                          ))}
                        </p>
                      ))
                    : entry.result.deferral.body.map((line, index) => (
                        <p key={`${entry.id}-d-${index}`} style={{ marginBottom: 8 }}>
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
              steps={retrievalSteps}
              collapsedByDefault={state === "answered"}
              durationMs={state === "answered" ? answerForState?.durationMs : undefined}
            />
          </>
        ) : null}

        {state === "streaming" && <StreamingAnswer />}
        {state === "answered" && answerForState ? (
          <AnsweredView answer={answerForState} onFollowUp={handleFollowUp} />
        ) : null}
        {state === "low" && deferralForState ? (
          <LowConfidenceView deferral={deferralForState} />
        ) : null}

        {admin ? (
          <DemoStateBar
            state={state}
            onChange={handleDemoStateChange}
            scenarios={ASK_SCENARIOS}
            scenarioId={scenarioId}
            onScenarioChange={handleScenarioChange}
            variantId={variantId}
            onVariantChange={handleVariantChange}
          />
        ) : null}

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
