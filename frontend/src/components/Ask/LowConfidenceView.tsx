"use client";

import { Fragment } from "react";

import { AlertWarnIcon, ArrowRightIcon, CompassIcon, PenIcon } from "@/components/Icon";
import { SAMPLE_DEFERRAL } from "@/lib/mock-data";

import { parseInline } from "./markdown";

/**
 * Deferral panel shown when the model isn't confident enough to answer
 * directly. v3 drops the confidence meter at the top — the deferral copy
 * itself signals limited agreement. Otherwise unchanged.
 */
export function LowConfidenceView() {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            color: "var(--color-ext)",
            fontWeight: 500,
          }}
        >
          I&apos;m not confident enough to answer this directly.
        </span>
      </div>

      <div className="deferral">
        <div className="row">
          <div className="ic" aria-hidden="true">
            <AlertWarnIcon size={18} />
          </div>
          <div className="body">
            {SAMPLE_DEFERRAL.body.map((paragraph, index) => (
              <p key={index}>
                {parseInline(paragraph).map((node, nodeIndex) => (
                  <Fragment key={nodeIndex}>{node}</Fragment>
                ))}
              </p>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            paddingLeft: 28,
            flexWrap: "wrap",
          }}
        >
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
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 12,
          color: "var(--color-ink-4)",
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          maxWidth: 480,
        }}
      >
        Mishkāt is designed to defer rather than speculate. When the tafsir corpus doesn&apos;t
        address a question directly, you&apos;ll see a panel like this instead of a
        confident-sounding answer that isn&apos;t grounded.
      </div>
    </>
  );
}
