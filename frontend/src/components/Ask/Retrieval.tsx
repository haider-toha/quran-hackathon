"use client";

import clsx from "clsx";
import { useState } from "react";

import { CheckIcon, ChevronDownIcon } from "@/components/Icon";
import type { RetrievalStep } from "@/types";

type Props = {
  steps: readonly RetrievalStep[];
  /**
   * When `true`, the pipeline starts collapsed — used on the answered state
   * where we only want a single-line summary plus an expand affordance.
   * Defaults to `false` (full pipeline visible) — the streaming state.
   */
  collapsedByDefault?: boolean;
  /**
   * Optional total time the retrieval pipeline took, in milliseconds. Shown
   * in the collapsed summary as `· <Ts>s`.
   */
  durationMs?: number;
};

/**
 * Pipeline indicator showing which tafsir sources have been searched.
 *
 * Two render modes:
 *  - Full list (streaming): shows every step with `done | active | pending`
 *    visuals. The visuals come from the `.retrieval` family of classes in
 *    `globals.css`.
 *  - Collapsed (answered): shows a single line `Searched N sources · Ts`
 *    with a chevron toggle. Click the chevron to re-expand.
 */
export function Retrieval({ steps, collapsedByDefault = false, durationMs }: Props) {
  const [expanded, setExpanded] = useState<boolean>(!collapsedByDefault);

  if (collapsedByDefault && !expanded) {
    const sourceCount = steps.length;
    const seconds = typeof durationMs === "number" ? (durationMs / 1000).toFixed(1) : null;
    return (
      <div className="retrieval retrieval-collapsed" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className="retrieval-collapse-btn"
          onClick={() => setExpanded(true)}
          aria-expanded="false"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
            color: "var(--color-ink-3)",
            fontFamily: "inherit",
            fontSize: 12.5,
            textAlign: "left",
          }}
        >
          <span>
            Searched <span className="src-name">{sourceCount}</span> source
            {sourceCount === 1 ? "" : "s"}
            {seconds === null ? null : (
              <>
                {" · "}
                <span className="meta" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>
                  {seconds}s
                </span>
              </>
            )}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5 }}>
            <ChevronDownIcon size={12} /> expand
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="retrieval" style={{ marginBottom: 24 }}>
      {collapsedByDefault ? (
        <button
          type="button"
          className="retrieval-collapse-btn"
          onClick={() => setExpanded(false)}
          aria-expanded="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
            color: "var(--color-ink-4)",
            fontFamily: "inherit",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <ChevronDownIcon size={11} style={{ transform: "rotate(180deg)" }} />
          Collapse
        </button>
      ) : null}
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
