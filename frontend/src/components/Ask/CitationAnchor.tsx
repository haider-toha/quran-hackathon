"use client";

import { useState } from "react";

import { FloatingCard } from "@/components/FloatingCard";
import type { AnswerCitation } from "@/types";

type Props = {
  citation: AnswerCitation;
};

/**
 * Inline `[n]` citation anchor with a hover/focus card showing the source's
 * Arabic and English snippet. The card is portaled to `document.body` via
 * `FloatingCard` so it never clips at viewport or container edges.
 */
export function CitationAnchor({ citation }: Props) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  function show() {
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  return (
    <span className="cite-anchor" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={setAnchor}
        type="button"
        className="cite"
        aria-describedby={open ? `cite-card-${citation.number}` : undefined}
        aria-label={`Citation ${citation.number}: ${citation.source}`}
        onFocus={show}
        onBlur={hide}
      >
        [{citation.number}]
      </button>
      <FloatingCard anchor={anchor} open={open} onClose={hide} placement="auto" role="tooltip">
        <span
          id={`cite-card-${citation.number}`}
          className="cite-card-portal"
          style={{
            display: "block",
            width: 320,
            padding: "12px 14px",
            fontFamily: "var(--font-serif)",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--color-ink-2)",
            fontWeight: 380,
            textAlign: "left",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sans)",
              fontSize: 10.5,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-tafsir)",
              marginBottom: 6,
            }}
          >
            {citation.source}
          </span>
          <span
            dir="rtl"
            lang="ar"
            style={{
              display: "block",
              fontFamily: "var(--font-arabic)",
              direction: "rtl",
              fontSize: 17,
              lineHeight: 1.9,
              marginBottom: 6,
              color: "var(--color-ink)",
              fontWeight: 400,
              textAlign: "right",
            }}
          >
            {citation.arabic}
          </span>
          <span style={{ display: "block" }}>{citation.english}</span>
        </span>
      </FloatingCard>
    </span>
  );
}
