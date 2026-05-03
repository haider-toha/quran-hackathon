"use client";

// ConfidenceLabel — the dot+caption that sits above an answer body
// telling the user how grounded the answer is. Phase 6 of the Ask
// redesign: visible uncertainty.
//
// Three states:
//   - "grounded" (server-side `confidence.level === "high"`) — green dot,
//     "Grounded in N sources"
//   - "partial" (`"med"`)   — amber dot, "Partially grounded — some claims
//     are inferred"
//   - "deferred" (`"low"`)  — gray dot, "Insufficient source coverage."
//
// In v3 this component renders the first two; the deferred surface is
// `LowConfidenceView`, which renders its own deferred-state heading.

import type { ConfidenceLevel } from "@/types";

import { ConfidenceLegend } from "./ConfidenceLegend";

export type ConfidenceState = "grounded" | "partial" | "deferred";

export function levelToState(level: ConfidenceLevel): ConfidenceState {
  if (level === "high") return "grounded";
  if (level === "med") return "partial";
  return "deferred";
}

type Props = {
  state: ConfidenceState;
  // Number of unique sources actually cited. Only used in the "grounded"
  // copy ("Grounded in N sources"). For "partial" and "deferred" the
  // copy is fixed.
  uniqueSources?: number;
};

function copyFor(state: ConfidenceState, uniqueSources: number | undefined): string {
  if (state === "grounded") {
    if (typeof uniqueSources === "number" && uniqueSources > 0) {
      return `Grounded in ${uniqueSources} source${uniqueSources === 1 ? "" : "s"}`;
    }
    return "Grounded";
  }
  if (state === "partial") {
    return "Partially grounded — some claims are inferred";
  }
  return "Insufficient source coverage. Consider expanding scope or sources.";
}

export function ConfidenceLabel({ state, uniqueSources }: Props) {
  return (
    <div className={`confidence-label is-${state}`} role="status">
      <span className="confidence-dot" aria-hidden="true" />
      <span className="confidence-text">{copyFor(state, uniqueSources)}</span>
      <ConfidenceLegend />
    </div>
  );
}
