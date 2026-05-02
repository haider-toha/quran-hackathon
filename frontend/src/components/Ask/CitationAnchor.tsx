"use client";

import { useState } from "react";

import type { AnswerCitation } from "@/types";

type Props = {
  citation: AnswerCitation;
};

/**
 * Inline `[n]` citation anchor with a hover/focus card showing the source's
 * Arabic and English snippet. The card is purely decorative — pointer events
 * are disabled in `globals.css`, so it never traps the cursor.
 */
export function CitationAnchor({ citation }: Props) {
  const [open, setOpen] = useState(false);

  function show() {
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  return (
    <span
      className="cite-anchor"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        className="cite"
        aria-describedby={open ? `cite-card-${citation.number}` : undefined}
        aria-label={`Citation ${citation.number}: ${citation.source}`}
      >
        [{citation.number}]
      </button>
      {open && (
        <span id={`cite-card-${citation.number}`} className="cite-card" role="tooltip">
          <span className="who">{citation.source}</span>
          <span className="ar" dir="rtl" lang="ar">
            {citation.arabic}
          </span>
          <span>{citation.english}</span>
        </span>
      )}
    </span>
  );
}
