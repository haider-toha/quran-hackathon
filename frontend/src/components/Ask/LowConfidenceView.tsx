"use client";

import { AlertWarnIcon, ArrowRightIcon, CompassIcon, LayersIcon, PenIcon } from "@/components/Icon";
import { parseInline } from "@/lib/markdown";
import { SAMPLE_DEFERRAL } from "@/lib/mock-data";
import type { Deferral, DeferralNextStep, DeferralNextStepKind } from "@/types";

import { ConfidenceLabel } from "./ConfidenceLabel";

type Props = {
  // The active deferral. Defaults to SAMPLE_DEFERRAL so existing call sites
  // that don't yet pass scenarios continue to render the canonical body.
  deferral?: Deferral;
};

function iconFor(kind: DeferralNextStepKind) {
  if (kind === "enable-source") return <LayersIcon size={13} />;
  if (kind === "widen-scope") return <ArrowRightIcon size={13} />;
  if (kind === "rephrase") return <PenIcon size={13} />;
  return <CompassIcon size={13} />;
}

/**
 * Deferral panel shown when the model isn't confident enough to answer
 * directly. v3 surfaces the deferred state with the same dot+label
 * vocabulary as grounded/partial answers (`<ConfidenceLabel state="deferred"
 * />`), and renders the model's concrete next-step suggestions as
 * actionable buttons under the body. The static "Show / Rephrase /
 * External" trio remains as a fallback when a deferral has no authored
 * next steps.
 */
export function LowConfidenceView({ deferral = SAMPLE_DEFERRAL }: Props = {}) {
  const nextSteps: readonly DeferralNextStep[] = deferral.nextSteps ?? [];
  return (
    <>
      <ConfidenceLabel state="deferred" />

      <div className="deferral">
        <div className="row">
          <div className="ic" aria-hidden="true">
            <AlertWarnIcon size={18} />
          </div>
          <div className="body">
            {deferral.body.map((paragraph, index) => (
              <p key={`p-${index}`}>{parseInline(paragraph, `p-${index}`)}</p>
            ))}
          </div>
        </div>

        {nextSteps.length > 0 ? (
          <div className="deferral-next-steps" role="group" aria-label="Suggested next steps">
            <span className="deferral-next-steps-label">Suggested next steps</span>
            <div className="deferral-next-steps-row">
              {nextSteps.map((step, index) => (
                <button
                  key={`ns-${index}-${step.label}`}
                  type="button"
                  className="btn deferral-next-step-btn"
                  data-kind={step.kind}
                >
                  {iconFor(step.kind)} {step.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="deferral-fallback-row">
            <button type="button" className="btn">
              <ArrowRightIcon size={13} /> Show what the sources do say
            </button>
            <button type="button" className="btn">
              <PenIcon size={13} /> Rephrase question
            </button>
            <button type="button" className="btn ghost">
              <CompassIcon size={13} /> Try external research
            </button>
          </div>
        )}
      </div>

      <p className="deferral-note">
        Mishkat is designed to defer rather than speculate. When the tafsir corpus doesn&apos;t
        address a question directly, you&apos;ll see a panel like this instead of a
        confident-sounding answer that isn&apos;t grounded.
      </p>
    </>
  );
}
