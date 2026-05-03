"use client";

// ConfidenceLegend — the small `?` icon next to a ConfidenceLabel that
// opens a popover explaining the three states. Phase 10 polish: don't make
// users guess what "Grounded" / "Partial" / "Deferred" mean.
//
// Structurally simple: a button anchor + FloatingCard. Closes on outside
// click and Escape (FloatingCard handles those for `role="dialog"`).

import { useCallback, useState } from "react";

import { FloatingCard } from "@/components/FloatingCard";
import { QuestionIcon } from "@/components/Icon";

export function ConfidenceLegend() {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={setAnchor}
        type="button"
        className="confidence-legend-trigger"
        aria-label="What do these confidence states mean?"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
      >
        <QuestionIcon size={11} />
      </button>
      <FloatingCard anchor={anchor} open={open} onClose={close} placement="bottom" role="dialog">
        <div className="confidence-legend">
          <h3 className="confidence-legend-title">How we label answers</h3>
          <dl className="confidence-legend-list">
            <div className="confidence-legend-row">
              <dt className="confidence-legend-term">
                <span className="confidence-dot is-grounded" aria-hidden />
                Grounded
              </dt>
              <dd className="confidence-legend-def">
                Every claim in the answer is backed by a citation from an enabled tafsir source.
              </dd>
            </div>
            <div className="confidence-legend-row">
              <dt className="confidence-legend-term">
                <span className="confidence-dot is-partial" aria-hidden />
                Partial
              </dt>
              <dd className="confidence-legend-def">
                Most claims cite a source. A few are inferred from surrounding context and are
                marked in the prose.
              </dd>
            </div>
            <div className="confidence-legend-row">
              <dt className="confidence-legend-term">
                <span className="confidence-dot is-deferred" aria-hidden />
                Deferred
              </dt>
              <dd className="confidence-legend-def">
                The enabled sources do not cover this question well enough to answer. Try widening
                the scope or enabling another tafsir.
              </dd>
            </div>
          </dl>
        </div>
      </FloatingCard>
    </>
  );
}
