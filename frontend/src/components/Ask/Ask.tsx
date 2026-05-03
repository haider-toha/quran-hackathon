"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SlashMenu } from "@/components/SlashMenu";
import { useAdminMode } from "@/hooks/useAdminMode";
import {
  appendMessage,
  appendScopeChange,
  clearThread,
  createThread,
  getThread,
  setThreadAnswerView,
  useThread,
} from "@/lib/chat-store";
import { setContextPanelCollapsed } from "@/lib/context-panel-store";
import {
  ASK_SCENARIOS,
  STREAMING_RETRIEVAL,
  defaultVariantFor,
  findScenario,
} from "@/lib/mock-data";
import { addRecent } from "@/lib/recents";
import { useScope } from "@/lib/scope-context";
import { openScopePicker } from "@/lib/scope-picker-store";
import { openSourcesPanel } from "@/lib/sources-panel-store";
import type {
  Answer,
  AskScenario,
  AskScenarioVariant,
  Deferral,
  RetrievalStep,
  SlashCommand,
} from "@/types";

import { AskInput, DEFAULT_SOURCE_MODE, type SourceModeValue } from "./AskInput";
import { ConsultingStrip } from "./ConsultingStrip";
import { ContextPanel } from "./ContextPanel";
import { Conversation } from "./Conversation";
import { DemoStateBar, type DemoState } from "./DemoStateBar";
import { PromptCards } from "./PromptCards";
import { Retrieval } from "./Retrieval";
import { ScopeBreadcrumb } from "./ScopeBreadcrumb";
import { StreamingAnswer } from "./StreamingAnswer";

type LocalState = "input" | "consulting" | "streaming";

// Minimum time the consulting strip stays on screen before we flip into
// streaming. Brief enough that users don't feel held back, long enough
// that they actually register what's being searched.
const CONSULTING_DURATION_MS = 1100;

const FALLBACK_SCENARIO: AskScenario = (() => {
  const first = ASK_SCENARIOS[0];
  if (!first) throw new Error("ASK_SCENARIOS is empty");
  return first;
})();

// Above this viewport width the right-hand ContextPanel defaults open. Below
// it the canvas is too narrow to host the panel without crowding the
// conversation column, so it starts collapsed and the user opts in.
const CONTEXT_PANEL_DEFAULT_OPEN_WIDTH = 1280;

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
 * Top-level Ask screen. The canvas itself owns three regions:
 *   - the scope breadcrumb (top, beneath the global topbar)
 *   - the conversation column (centre)
 *   - the optional ContextPanel (right; hosts the verses the AI is grounded
 *     to, side-by-side Arabic + English)
 *
 * The chat-history sidebar moved out — it now lives in the main left rail
 * (`<ChatHistorySection />`), folded under the primary nav. That frees the
 * canvas to host the context panel without adding a third column.
 *
 * Empty state vs in-conversation state:
 *   - Empty: heading + subhead + prompt-cards + a centered composer
 *   - With messages: the conversation log scrolls under a docked composer
 *     pinned to the bottom of the canvas
 */
export function Ask() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin } = useAdminMode();

  const scope = useScope();

  const threadId = searchParams?.get("thread") ?? null;
  const thread = useThread(threadId);

  const initialQuery = searchParams?.get("q") ?? "";
  // The input/consulting/streaming machine is intentionally local.
  // Resolved exchanges live in the chat-store; nothing waits in component
  // state past streaming. Phase 4 added the brief "consulting" surface
  // between input and streaming so the user sees which sources are being
  // searched before the answer body lands.
  const [state, setState] = useState<LocalState>("input");
  const [scenarioId, setScenarioId] = useState<string>(FALLBACK_SCENARIO.id);
  const [variantId, setVariantId] = useState<string>(() => pickAnswerVariant(FALLBACK_SCENARIO).id);
  const [question, setQuestion] = useState<string>(initialQuery);
  const [pendingQuestion, setPendingQuestion] = useState<string>("");
  const [sourceMode, setSourceMode] = useState<SourceModeValue>(DEFAULT_SOURCE_MODE);
  // ContextPanel default is "open" on SSR; we flip to collapsed on the
  // client when the viewport is below the threshold. Phase 9 lifts the
  // collapsed flag into the context-panel store so the global ⌘⇧C shortcut
  // can flip it from anywhere; the Ask shell still owns the initial
  // breakpoint check and seeds the store on mount. Subsequent viewport
  // changes don't auto-flip — users find their canvas resizing behind
  // their back hostile. The seed runs in an effect (not a render-time
  // conditional) because mutating an external store during render can
  // tear downstream subscribers; the effect fires once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setContextPanelCollapsed(window.innerWidth < CONTEXT_PANEL_DEFAULT_OPEN_WIDTH);
    // Empty dep array — this is a one-shot mount-time seed. The store
    // owns the flag from this point on.
  }, []);

  // Derived-from-prop reset: when the URL's thread id changes we drop any
  // in-flight composer state. The conditional setState during render is the
  // React 19 pattern for "reset state when a prop changes" — useEffect would
  // trigger a cascading-render lint error.
  const [trackedThreadId, setTrackedThreadId] = useState<string | null>(threadId);
  if (trackedThreadId !== threadId) {
    setTrackedThreadId(threadId);
    setState("input");
    setQuestion("");
    setPendingQuestion("");
  }

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Mirror the textarea node in state so the SlashMenu's anchor prop is a
  // proper React-tracked dependency rather than a render-time ref read.
  const [textareaEl, setTextareaEl] = useState<HTMLTextAreaElement | null>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const setCombinedTextareaRef = useCallback((node: HTMLTextAreaElement | null) => {
    textareaRef.current = node;
    setTextareaEl(node);
  }, []);

  const scenario = useMemo<AskScenario>(
    () => findScenario(scenarioId) ?? FALLBACK_SCENARIO,
    [scenarioId],
  );
  // Auto-scroll the conversation pane when new messages land or when the
  // in-flight surface flips state.
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [thread?.messages.length, state]);

  // Make sure we always submit into a thread. If the user is on the empty
  // /ask landing, create a fresh one and rewrite the URL so the rest of the
  // flow has a stable id to write to.
  const ensureThreadId = useCallback((): string => {
    if (threadId) return threadId;
    const created = createThread(scope.label);
    router.replace(`/ask?thread=${created.id}`, { scroll: false });
    return created.id;
  }, [router, threadId, scope.label]);

  // When the active scope changes mid-conversation, leave a system divider
  // in the log so the user can see exactly which exchanges were grounded to
  // which slice. The chat-store de-dupes against the most-recent scope so a
  // fresh thread (or a no-op re-render) doesn't insert a redundant divider.
  // This effect runs on a derived signal (scope.label vs thread.scope), so
  // we stash the previous value in a ref and only fire when the user
  // actually re-targets, not on initial mount.
  const lastScopeForThread = useRef<{ threadId: string | null; scope: string }>({
    threadId: null,
    scope: scope.label,
  });
  useEffect(() => {
    if (!thread) {
      lastScopeForThread.current = { threadId: null, scope: scope.label };
      return;
    }
    const prev = lastScopeForThread.current;
    if (prev.threadId !== thread.id) {
      // Switched threads; baseline against the thread's persisted scope so
      // the next user-driven scope change diffs from there, not from the
      // previous thread's scope.
      lastScopeForThread.current = { threadId: thread.id, scope: thread.scope };
      return;
    }
    if (prev.scope === scope.label) return;
    // Only insert a divider once the thread already holds at least one
    // exchange — re-targeting an empty thread is silent (it just updates the
    // thread's scope on next exchange).
    const hasExchange = thread.messages.some((m) => m.kind === "exchange");
    if (hasExchange) {
      appendScopeChange(thread.id, scope.label);
    }
    lastScopeForThread.current = { threadId: thread.id, scope: scope.label };
  }, [thread, scope.label]);

  // Resolve a streaming/in-flight exchange into a persisted message and
  // reset the composer for the next turn. Caller passes the question text +
  // the canonical answer or deferral.
  const persistAnswer = useCallback(
    (questionText: string, answer: Answer): void => {
      const id = ensureThreadId();
      if (!getThread(id)) return;
      appendMessage(id, {
        question: questionText || answer.question,
        result: { kind: "answer", answer },
      });
      setQuestion("");
      setPendingQuestion("");
      setState("input");
    },
    [ensureThreadId],
  );

  const persistDeferral = useCallback(
    (questionText: string, deferral: Deferral): void => {
      const id = ensureThreadId();
      if (!getThread(id)) return;
      appendMessage(id, {
        question: questionText || deferral.question,
        result: { kind: "deferral", deferral },
      });
      setQuestion("");
      setPendingQuestion("");
      setState("input");
    },
    [ensureThreadId],
  );

  const handleSubmit = useCallback(() => {
    const trimmed = question.trim();
    if (trimmed.length === 0) return;
    setPendingQuestion(trimmed);
    setVariantId(pickAnswerVariant(scenario).id);
    setState("consulting");
    addRecent(trimmed, "/ask");
    ensureThreadId();
  }, [question, scenario, ensureThreadId]);

  // Drive the consulting → streaming auto-transition. The timer callback
  // is the async boundary, so calling setState from inside it is allowed
  // by the React 19 lint rules (we are NOT setting state synchronously
  // in the effect body itself).
  useEffect(() => {
    if (state !== "consulting") return;
    const timer = window.setTimeout(() => {
      setState((current) => (current === "consulting" ? "streaming" : current));
    }, CONSULTING_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const handleStop = useCallback(() => {
    // Hitting stop during the consulting surface is a true cancel — we
    // never reached an answer body, so we just snap back to input
    // without persisting anything.
    if (state === "consulting") {
      setState("input");
      return;
    }
    const nextVariant = pickAnswerVariant(scenario);
    const answer = activeAnswer(nextVariant);
    if (!answer) {
      setState("input");
      return;
    }
    setVariantId(nextVariant.id);
    persistAnswer(pendingQuestion, answer);
  }, [scenario, pendingQuestion, persistAnswer, state]);

  // Demo-bar transitions. "input" / "consulting" / "streaming" are local;
  // "answered" / "low" resolve straight into the thread so admin scenario
  // picks land in the persisted conversation just like a real submission.
  const handleDemoStateChange = useCallback(
    (next: DemoState) => {
      if (next === "input") {
        setState("input");
        setQuestion("");
        setPendingQuestion("");
        return;
      }
      if (next === "consulting") {
        const v = pickAnswerVariant(scenario);
        const q = activeAnswer(v)?.question ?? "";
        setVariantId(v.id);
        setQuestion(q);
        setPendingQuestion(q);
        setState("consulting");
        return;
      }
      if (next === "streaming") {
        const v = pickAnswerVariant(scenario);
        const q = activeAnswer(v)?.question ?? "";
        setVariantId(v.id);
        setQuestion(q);
        setPendingQuestion(q);
        setState("streaming");
        return;
      }
      if (next === "answered") {
        const v = pickAnswerVariant(scenario);
        const answer = activeAnswer(v);
        if (!answer) return;
        setVariantId(v.id);
        persistAnswer(answer.question, answer);
        return;
      }
      if (next === "low") {
        const v = pickDeferralVariant(scenario);
        const deferral = activeDeferral(v);
        if (!deferral) return;
        setVariantId(v.id);
        persistDeferral(deferral.question, deferral);
      }
    },
    [scenario, persistAnswer, persistDeferral],
  );

  // Pretend "current state" for the demo bar's segmented control. The
  // bar expects one of input/consulting/streaming/answered/low; the
  // local machine only ever sits in input/consulting/streaming
  // (post-resolution we snap back to input).
  const demoBarState: DemoState = state;

  const handleScenarioChange = useCallback((id: string) => {
    setScenarioId(id);
    const next = findScenario(id);
    if (!next) return;
    const nextVariant = pickAnswerVariant(next);
    setVariantId(nextVariant.id);
    const q = activeAnswer(nextVariant)?.question ?? "";
    setQuestion(q);
    setPendingQuestion(q);
  }, []);

  const handleVariantChange = useCallback(
    (id: string) => {
      const nextVariant = scenario.variants.find((v) => v.id === id);
      if (!nextVariant) return;
      setVariantId(id);
      const outcome = nextVariant.outcome;
      if (outcome.kind === "answer") {
        persistAnswer(outcome.answer.question, outcome.answer);
      } else {
        persistDeferral(outcome.deferral.question, outcome.deferral);
      }
    },
    [scenario, persistAnswer, persistDeferral],
  );

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
        setSlashQuery("");
        setSlashOpen(true);
        return;
      }
      if (slashOpen) {
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
      if (slashIndex === -1) return;
      if (cmd.id === "search") {
        const stripped = (value.slice(0, slashIndex) + value.slice(caret)).trim();
        const finalQuestion = stripped.length > 0 ? stripped : "";
        setQuestion(finalQuestion);
        if (finalQuestion.length > 0) {
          addRecent(finalQuestion, "/ask");
          setPendingQuestion(finalQuestion);
          setVariantId(pickAnswerVariant(scenario).id);
          setState("consulting");
          ensureThreadId();
        }
        return;
      }
      // Side-effect commands strip the slash trigger from the input and run
      // their action directly. The user expects "/scope" to open the scope
      // picker, not to insert "/scope " into the textarea.
      if (
        cmd.id === "scope" ||
        cmd.id === "sources" ||
        cmd.id === "compare" ||
        cmd.id === "clear"
      ) {
        const stripped = value.slice(0, slashIndex) + value.slice(caret);
        setQuestion(stripped);
        if (cmd.id === "scope") {
          openScopePicker();
        } else if (cmd.id === "sources") {
          openSourcesPanel();
        } else if (cmd.id === "compare") {
          const id = ensureThreadId();
          const target = getThread(id);
          if (target) {
            const next =
              target.preferences.answerView === "synthesized" ? "by-source" : "synthesized";
            setThreadAnswerView(id, next);
          }
        } else if (cmd.id === "clear") {
          if (threadId) clearThread(threadId);
          setQuestion("");
          setPendingQuestion("");
          setState("input");
        }
        requestAnimationFrame(() => {
          node.focus();
          node.setSelectionRange(slashIndex, slashIndex);
        });
        return;
      }
      const replaced = value.slice(0, slashIndex) + `/${cmd.trigger} ` + value.slice(caret);
      setQuestion(replaced);
      const nextCaret = slashIndex + cmd.trigger.length + 2;
      requestAnimationFrame(() => {
        node.focus();
        node.setSelectionRange(nextCaret, nextCaret);
      });
    },
    [scenario, ensureThreadId, threadId],
  );

  const handlePromptCardPick = useCallback((seeded: string) => {
    setQuestion(seeded);
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(seeded.length, seeded.length);
    });
  }, []);

  // Retrieval steps depend on state + active variant. The streaming
  // surface still uses the canned STREAMING_RETRIEVAL pipeline (it
  // animates the pending → active → done transition); the consulting
  // strip pulls from the active variant's actual outcome so users see
  // the real source list for the question they asked.
  const retrievalSteps: readonly RetrievalStep[] = useMemo(() => {
    if (state === "input") return [];
    return STREAMING_RETRIEVAL;
  }, [state]);

  const activeVariant = useMemo<AskScenarioVariant>(
    () => scenario.variants.find((v) => v.id === variantId) ?? pickAnswerVariant(scenario),
    [scenario, variantId],
  );
  const consultingSteps: readonly RetrievalStep[] = useMemo(() => {
    if (state === "input") return [];
    const outcome = activeVariant.outcome;
    if (outcome.kind === "answer") return outcome.answer.retrieval;
    return outcome.deferral.retrieval;
  }, [state, activeVariant]);

  const showConsulting = state === "consulting";
  const showStreaming = state === "streaming";
  const showInflight = showConsulting || showStreaming;
  const isEmpty = !thread || thread.messages.length === 0;
  const showWelcome = isEmpty && state === "input";

  return (
    <div className="ask-shell">
      <div className="ask-screen">
        <ScopeBreadcrumb />

        {showWelcome ? (
          <div className="ask-empty-canvas">
            <div className="ask-empty-inner">
              <div className="ask-welcome">
                <h1>What would you like to explore?</h1>
                <p>
                  Ask grounded questions about <span className="ref-pill">{scope.label}</span>.
                  Answers cite the tafsirs you&apos;ve enabled.
                </p>
              </div>

              <PromptCards onPick={handlePromptCardPick} />

              <div className="ask-composer ask-composer-centered">
                <div className="ask-composer-inner">
                  <AskInput
                    ref={setCombinedTextareaRef}
                    state={state === "input" ? "idle" : "streaming"}
                    value={question}
                    scope={scope.label}
                    sourceMode={sourceMode}
                    onChange={setQuestion}
                    onSubmit={handleSubmit}
                    onStop={handleStop}
                    onSourceModeChange={setSourceMode}
                    onKeyDownExtra={handleKeyDownExtra}
                  />

                  {admin ? (
                    <DemoStateBar
                      state={demoBarState}
                      onChange={handleDemoStateChange}
                      scenarios={ASK_SCENARIOS}
                      scenarioId={scenarioId}
                      onScenarioChange={handleScenarioChange}
                      variantId={variantId}
                      onVariantChange={handleVariantChange}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="ask-conversation">
              <div className="ask-inner">
                <Conversation thread={thread} />

                {showInflight ? (
                  <div className="conversation-exchange conversation-inflight">
                    <div className="answer">
                      <span className="q-label">You asked</span>
                      <div className="q-text">{pendingQuestion || question}</div>
                    </div>

                    {showConsulting ? (
                      <ConsultingStrip steps={consultingSteps} />
                    ) : (
                      <>
                        <Retrieval steps={retrievalSteps} collapsedByDefault={false} />
                        <StreamingAnswer />
                      </>
                    )}
                  </div>
                ) : null}

                <div ref={conversationEndRef} />
              </div>
            </div>

            <div className="ask-composer ask-composer-docked">
              <div className="ask-composer-inner">
                <AskInput
                  ref={setCombinedTextareaRef}
                  state={state === "input" ? "idle" : "streaming"}
                  value={question}
                  scope={scope.label}
                  sourceMode={sourceMode}
                  onChange={setQuestion}
                  onSubmit={handleSubmit}
                  onStop={handleStop}
                  onSourceModeChange={setSourceMode}
                  onKeyDownExtra={handleKeyDownExtra}
                />

                {admin ? (
                  <DemoStateBar
                    state={demoBarState}
                    onChange={handleDemoStateChange}
                    scenarios={ASK_SCENARIOS}
                    scenarioId={scenarioId}
                    onScenarioChange={handleScenarioChange}
                    variantId={variantId}
                    onVariantChange={handleVariantChange}
                  />
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>

      <ContextPanel />

      <SlashMenu
        anchor={textareaEl}
        open={slashOpen}
        query={slashQuery}
        onSelect={handleSlashSelect}
        onClose={() => setSlashOpen(false)}
        allowedIds={["search", "ayah", "scope", "sources", "compare", "clear"]}
      />
    </div>
  );
}
