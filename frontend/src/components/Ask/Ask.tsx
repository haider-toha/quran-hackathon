"use client";

import { useCallback, useState } from "react";

import {
  SAMPLE_ANSWER,
  SAMPLE_DEFERRAL,
  SAMPLE_QUESTION,
  STREAMING_RETRIEVAL,
} from "@/lib/mock-data";
import type { AskState, RetrievalStep } from "@/types";

import { AnsweredView } from "./AnsweredView";
import { AskInput } from "./AskInput";
import { DemoStateBar } from "./DemoStateBar";
import { LowConfidenceView } from "./LowConfidenceView";
import { Retrieval } from "./Retrieval";
import { SourceMode } from "./SourceMode";
import { StreamingAnswer } from "./StreamingAnswer";

type DemoState = Extract<AskState, "streaming" | "answered" | "low">;

const SCOPE = "Ad-Ḍuḥā 93:1–11";

function questionFor(state: DemoState): string {
  return state === "low" ? SAMPLE_DEFERRAL.question : SAMPLE_QUESTION;
}

function getRetrievalSteps(state: DemoState): readonly RetrievalStep[] {
  if (state === "streaming") return STREAMING_RETRIEVAL;
  if (state === "low") return SAMPLE_DEFERRAL.retrieval;
  return SAMPLE_ANSWER.retrieval;
}

/**
 * Top-level Ask screen. Owns the demo state + the textarea value so an
 * in-progress edit is never silently discarded. Routes to the right
 * sub-view (`StreamingAnswer | AnsweredView | LowConfidenceView`).
 */
export function Ask() {
  const [state, setState] = useState<DemoState>("answered");
  const [question, setQuestion] = useState<string>(() => questionFor("answered"));
  // Track the last "canonical" sample value so we know when to overwrite
  // user input vs. preserve it. Switching demo state via the demo bar
  // refreshes the textarea; switching by clicking Ask/Stop does not.
  const [lastSampleSource, setLastSampleSource] = useState<DemoState>("answered");

  const handleDemoStateChange = useCallback((next: DemoState) => {
    setState(next);
    setQuestion(questionFor(next));
    setLastSampleSource(next);
  }, []);

  const handleSubmit = useCallback(() => {
    setState("streaming");
  }, []);

  const handleStop = useCallback(() => {
    setState("answered");
  }, []);

  // Read-only view of the canonical question for the current demo state
  // — used for the "Your question" header so it doesn't drift when the
  // user is mid-edit.
  const displayQuestion = state === lastSampleSource ? questionFor(state) : question;

  return (
    <div className="ask-screen">
      <div className="ask-inner">
        <AskInput
          state={state}
          value={question}
          scope={SCOPE}
          onChange={setQuestion}
          onSubmit={handleSubmit}
          onStop={handleStop}
        />

        <SourceMode />

        <div className="answer">
          <span className="q-label">Your question</span>
          <div className="q-text">{displayQuestion}</div>
        </div>

        <Retrieval steps={getRetrievalSteps(state)} />

        {state === "streaming" && <StreamingAnswer />}
        {state === "answered" && <AnsweredView />}
        {state === "low" && <LowConfidenceView />}

        <DemoStateBar state={state} onChange={handleDemoStateChange} />
      </div>
    </div>
  );
}
