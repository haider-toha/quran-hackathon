"use client";

// BySourceView — the comparative answer layout (Phase 7). Renders one
// column per cited source so the user can see what each mufassir said
// about the question side-by-side. Each column shows the source name +
// author as a header, the cited Arabic + English passage(s), and a short
// synthesized blurb (for v3 we use the citation's English snippet as the
// body — once a real RAG layer lands the body becomes a per-source
// summary).
//
// Layout: CSS-grid with one column per source, hairline 1px dividers
// between columns and no shadows — manuscript tradition over chrome. At
// narrow widths the grid wraps to a stacked single column.
//
// Single-source case: the toggle still renders, the column collapses to a
// single full-width card. Useful as a "what did this one mufassir say"
// stand-alone view even when there's nothing to compare against.

import { useCallback, useMemo } from "react";

import { setActiveCitation } from "@/lib/context-panel-store";
import type { Answer, AnswerCitation } from "@/types";

type Props = {
  answer: Answer;
};

type SourceColumn = {
  source: string;
  author: string;
  citations: readonly AnswerCitation[];
};

function groupCitationsBySource(citations: readonly AnswerCitation[]): readonly SourceColumn[] {
  const order: string[] = [];
  const groups = new Map<string, SourceColumn>();
  for (const citation of citations) {
    const existing = groups.get(citation.source);
    if (existing) {
      groups.set(citation.source, { ...existing, citations: [...existing.citations, citation] });
      continue;
    }
    order.push(citation.source);
    groups.set(citation.source, {
      source: citation.source,
      author: citation.author,
      citations: [citation],
    });
  }
  return order.map((key) => groups.get(key)!);
}

export function BySourceView({ answer }: Props) {
  const columns = useMemo(() => groupCitationsBySource(answer.citations), [answer.citations]);

  if (columns.length === 0) {
    return (
      <div className="by-source-empty">No citations yet — switch back to synthesized view.</div>
    );
  }

  return (
    <div
      className="by-source-grid"
      data-source-count={columns.length}
      role="list"
      aria-label="Sources side by side"
    >
      {columns.map((column) => (
        <SourceCard key={column.source} column={column} />
      ))}
    </div>
  );
}

function SourceCard({ column }: { column: SourceColumn }) {
  return (
    <article className="by-source-card" role="listitem">
      <header className="by-source-card-head">
        <span className="by-source-card-name">{column.source}</span>
        <span className="by-source-card-author">{column.author}</span>
      </header>
      <div className="by-source-card-body">
        {column.citations.map((citation) => (
          <CitationRow key={citation.number} citation={citation} />
        ))}
      </div>
    </article>
  );
}

function CitationRow({ citation }: { citation: AnswerCitation }) {
  const handleClick = useCallback(() => {
    setActiveCitation(citation);
  }, [citation]);
  return (
    <div className="by-source-citation">
      <div className="by-source-citation-head">
        <span className="by-source-citation-num" aria-hidden>
          [{citation.number}]
        </span>
        <span className="by-source-citation-ref">{citation.ref}</span>
      </div>
      <p className="by-source-citation-arabic" dir="rtl" lang="ar">
        {citation.arabic}
      </p>
      <p className="by-source-citation-english">{citation.english}</p>
      <button type="button" className="by-source-citation-open" onClick={handleClick}>
        Open in context panel
      </button>
    </div>
  );
}
