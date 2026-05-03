"use client";

// SourcesConsultedFooter — the "Sources consulted" chip rail that sits
// at the bottom of an answered exchange. Each chip names a source and
// its citation count; sources that contributed 0 citations render
// muted, so the user can see we tried that source and it returned
// nothing — diligence over silence.
//
// Counts are derived from `answer.citations` (count by `citation.source`),
// and the source list is derived from `answer.retrieval` (so we surface
// every source that was queried, including empty ones). Phase 4 of the
// Ask redesign.

import clsx from "clsx";

import type { Answer } from "@/types";

type Props = {
  answer: Answer;
};

type SourceCount = {
  source: string;
  count: number;
};

function tally(answer: Answer): readonly SourceCount[] {
  const counts = new Map<string, number>();
  // Seed with every source that was searched so 0-citation sources
  // appear in the footer rather than disappearing silently.
  for (const step of answer.retrieval) {
    counts.set(step.source, 0);
  }
  for (const citation of answer.citations) {
    counts.set(citation.source, (counts.get(citation.source) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([source, count]) => ({ source, count }));
}

export function SourcesConsultedFooter({ answer }: Props) {
  const tallied = tally(answer);
  if (tallied.length === 0) return null;
  return (
    <div className="sources-consulted">
      <span className="sources-consulted-label">Sources consulted</span>
      <ul className="sources-consulted-list">
        {tallied.map(({ source, count }) => (
          <li key={source} className={clsx("sources-consulted-chip", count === 0 && "is-empty")}>
            <span className="sources-consulted-name">{source}</span>
            <span className="sources-consulted-count">
              {count} citation{count === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
