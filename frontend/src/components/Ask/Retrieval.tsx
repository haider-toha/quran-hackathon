"use client";

import clsx from "clsx";

import { CheckIcon } from "@/components/Icon";
import type { RetrievalStep } from "@/types";

type Props = {
  steps: readonly RetrievalStep[];
};

/**
 * Pipeline indicator showing which tafsir sources have been searched.
 * Each step is one of `done | active | pending`; the visuals come from the
 * `.retrieval` family of classes in `globals.css`.
 */
export function Retrieval({ steps }: Props) {
  return (
    <div className="retrieval" style={{ marginBottom: 24 }}>
      {steps.map((step) => (
        <div key={step.source} className={clsx("step", step.status)}>
          <span className="ic" aria-hidden="true">
            {step.status === "done" && <CheckIcon size={12} />}
            {step.status === "active" && <span className="spinner" />}
          </span>
          <span>
            Searching <span className="src-name">{step.source}</span>
          </span>
          <span className="meta">{step.meta}</span>
        </div>
      ))}
    </div>
  );
}
