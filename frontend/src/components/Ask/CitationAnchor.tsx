"use client";

import { useCallback, useState } from "react";

import { FloatingCard } from "@/components/FloatingCard";
import { setActiveCitation } from "@/lib/context-panel-store";
import type { AnswerCitation } from "@/types";

type Props = {
  citation: AnswerCitation;
};

/**
 * Inline `[n]` citation anchor.
 *
 * Hover / focus opens a small tooltip card with the cited Arabic + English
 * snippet so the user can preview without leaving the answer. Click (or
 * Enter / Space) flips the right-hand `ContextPanel` into citation mode and
 * scrolls to the full passage — citations are anchors, not footnotes
 * (Phase 5 of the Ask redesign).
 *
 * The card is portaled to `document.body` via `FloatingCard` so it never
 * clips at viewport or container edges.
 */
export function CitationAnchor({ citation }: Props) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  const handleClick = useCallback(() => {
    // Close the tooltip on click — the user has chosen the panel as their
    // reading destination, no need to keep both surfaces open.
    setOpen(false);
    setActiveCitation(citation);
  }, [citation]);

  return (
    <span className="cite-anchor" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={setAnchor}
        type="button"
        className="cite"
        aria-describedby={open ? `cite-card-${citation.number}` : undefined}
        aria-label={`Citation ${citation.number} from ${citation.source}. Open in context panel.`}
        onFocus={show}
        onBlur={hide}
        onClick={handleClick}
      >
        [{citation.number}]
      </button>
      <FloatingCard anchor={anchor} open={open} onClose={hide} placement="auto" role="tooltip">
        <div id={`cite-card-${citation.number}`} className="cite-card">
          <span className="cite-card-source">{citation.source}</span>
          <span className="cite-card-ref">{citation.ref}</span>
          <p className="cite-card-arabic" dir="rtl" lang="ar">
            {citation.arabic}
          </p>
          <p className="cite-card-english">{citation.english}</p>
          <span className="cite-card-hint">Click to open in context panel</span>
        </div>
      </FloatingCard>
    </span>
  );
}
