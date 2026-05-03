"use client";

// ConsultingStrip — the brief "we're searching the corpus" surface that
// renders BEFORE the answer streams. Phase 4 of the Ask redesign:
// transparency over magic. The strip persists for at least 1.0s so the
// user actually registers what's being consulted; sources that returned
// nothing appear with a strikethrough so the user can see we tried and
// came up empty rather than silently dropped them.
//
// Behaviour is purely presentational. The visibility timer is owned by
// the parent (`Ask.tsx`) — this component just renders what it's given.

import clsx from "clsx";

import type { RetrievalStep } from "@/types";

type Props = {
  steps: readonly RetrievalStep[];
};

// A retrieval step that returned nothing relevant is marked by the mock
// data as a `done` step whose meta starts with "0" or contains "out of
// scope". This is the demo-only convention; in production the backend
// would pass an explicit `hits: number` or similar.
function isEmpty(step: RetrievalStep): boolean {
  if (step.status !== "done") return false;
  const meta = step.meta.toLowerCase();
  return meta.startsWith("0 ") || meta.includes("out of scope");
}

export function ConsultingStrip({ steps }: Props) {
  if (steps.length === 0) return null;
  return (
    <div className="consulting-strip" role="status" aria-live="polite">
      <span className="consulting-strip-label">Searching</span>
      <ul className="consulting-strip-list">
        {steps.map((step) => {
          const empty = isEmpty(step);
          return (
            <li
              key={step.source}
              className={clsx("consulting-strip-item", `is-${step.status}`, empty && "is-empty")}
            >
              <span className="consulting-strip-marker" aria-hidden="true" />
              <span className="consulting-strip-name">{step.source}</span>
            </li>
          );
        })}
      </ul>
      <span className="consulting-strip-progress" aria-hidden="true">
        <span className="consulting-strip-progress-bar" />
      </span>
    </div>
  );
}
