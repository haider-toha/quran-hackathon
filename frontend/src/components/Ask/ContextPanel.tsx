"use client";

// ContextPanel — the right-hand panel on /ask that shows the verses the AI
// is currently grounded to, side-by-side Arabic + English. Always visible
// when a scope is set, collapsible via the header chevron, defaults open at
// ≥1280px (the parent decides initial state — this component is purely
// presentational over its `collapsed` prop).
//
// Two modes:
//   - "verse"    — the scoped surah verses (default).
//   - "citation" — a specific cited tafsir passage with surrounding
//     context. Entered automatically when the user clicks an inline
//     citation anchor; can be flipped manually via the segmented toggle
//     in the panel header.
//
// The active citation lives in `lib/context-panel-store.ts` so any
// component on the page (CitationAnchor, AnsweredView's cite-list rows,
// the panel itself) reads/writes the same source of truth without
// prop-drilling.

import clsx from "clsx";
import Link from "next/link";

import { ChevronRightIcon } from "@/components/Icon";
import {
  clearActiveCitation,
  setContextPanelMode,
  toggleContextPanelCollapsed,
  useContextPanelState,
} from "@/lib/context-panel-store";
import { TAFSIR_AD_DUHA, findSurah } from "@/lib/mock-data";
import { useScope } from "@/lib/scope-context";
import type { AnswerCitation, TafsirCitation, TafsirEntry, Verse } from "@/types";

// Pull the verse number out of a citation's `ref` (e.g. "93:3" → 3,
// "93:6-8" → 6, "93:6-11" → 6). Returns null if the format doesn't
// resolve to a known Ad-Duha verse — the panel falls back to a graceful
// "passage not available" notice.
function parseCitationVerse(ref: string): number | null {
  const match = ref.match(/^\s*\d+\s*:\s*(\d+)/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return null;
  return n;
}

// Map a citation source string to one of the tafsir-entry source ids
// (`sadi` / `kathir` / `qurtubi`). Citation source strings vary slightly
// from the canonical names (`Tafsir at-Tabari (via al-Qurtubi)`,
// `Sahih al-Bukhari 4983 / Muslim 1797`, etc.), so we normalise to a
// lowercase match against known fragments.
function matchTafsirCitation(citation: AnswerCitation, entry: TafsirEntry): TafsirCitation | null {
  const source = citation.source.toLowerCase();
  for (const tc of entry.citations) {
    if (source.includes(tc.id)) return tc;
    if (source.includes(tc.source.toLowerCase())) return tc;
  }
  return null;
}

type CitationLookup = {
  entry: TafsirEntry | null;
  match: TafsirCitation | null;
};

function lookupCitation(citation: AnswerCitation): CitationLookup {
  const verseNumber = parseCitationVerse(citation.ref);
  if (verseNumber === null) return { entry: null, match: null };
  const entry = TAFSIR_AD_DUHA[verseNumber] ?? null;
  if (!entry) return { entry: null, match: null };
  return { entry, match: matchTafsirCitation(citation, entry) };
}

export function ContextPanel() {
  const scope = useScope();
  const surah = findSurah(scope.surahNumber);
  const { mode, activeCitation, collapsed } = useContextPanelState();

  // Filter verses to the active range. If the surah lookup misses (out-of-
  // corpus scope number) we still render the chrome so the panel doesn't
  // collapse to nothing while the user is mid-edit.
  const verses =
    surah?.verses.filter((v) => v.number >= scope.range.start && v.number <= scope.range.end) ?? [];

  // If we're in citation mode but have no active citation, fall back to
  // verse mode visually — the toggle stays available.
  const effectiveMode = mode === "citation" && activeCitation === null ? "verse" : mode;

  return (
    <aside
      className={clsx("context-panel", collapsed && "collapsed")}
      aria-label="Active scope context"
    >
      <header className="context-panel-head">
        <button
          type="button"
          className="context-panel-toggle"
          onClick={toggleContextPanelCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand context panel" : "Collapse context panel"}
        >
          <ChevronRightIcon
            size={12}
            style={{ transform: collapsed ? "rotate(180deg)" : "none" }}
          />
        </button>
        {!collapsed ? (
          <div className="context-panel-title">
            <span className="context-panel-eyebrow">
              {effectiveMode === "citation" ? "Citation" : "Scope"}
            </span>
            <span className="context-panel-name">
              {effectiveMode === "citation" && activeCitation ? activeCitation.source : scope.label}
            </span>
          </div>
        ) : null}
      </header>

      {!collapsed ? (
        <>
          <div className="context-panel-modes" role="tablist" aria-label="Context panel mode">
            <button
              type="button"
              role="tab"
              aria-selected={effectiveMode === "verse"}
              className={clsx("context-panel-mode-btn", effectiveMode === "verse" && "is-active")}
              onClick={() => {
                setContextPanelMode("verse");
              }}
            >
              Verses
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={effectiveMode === "citation"}
              className={clsx(
                "context-panel-mode-btn",
                effectiveMode === "citation" && "is-active",
              )}
              onClick={() => {
                setContextPanelMode("citation");
              }}
              disabled={activeCitation === null}
              title={
                activeCitation === null
                  ? "Click any citation in an answer to open it here"
                  : undefined
              }
            >
              Citation
            </button>
          </div>
          <div className="context-panel-body">
            {effectiveMode === "citation" && activeCitation ? (
              <CitationView citation={activeCitation} surahNumber={scope.surahNumber} />
            ) : (
              <VerseListView
                verses={verses}
                showBismillah={surah?.bismillah !== undefined && scope.range.start === 1}
                bismillah={surah?.bismillah ?? null}
              />
            )}
          </div>
        </>
      ) : null}
    </aside>
  );
}

function VerseListView({
  verses,
  showBismillah,
  bismillah,
}: {
  verses: readonly Verse[];
  showBismillah: boolean;
  bismillah: string | null;
}) {
  return (
    <>
      {showBismillah && bismillah ? (
        <div className="context-bismillah" dir="rtl" lang="ar">
          {bismillah}
        </div>
      ) : null}
      <ol className="context-verse-list">
        {verses.map((verse) => (
          <li key={verse.number} className="context-verse">
            <span className="context-verse-num">{verse.number}</span>
            <div className="context-verse-text">
              <p className="context-verse-arabic" dir="rtl" lang="ar">
                {verse.arabic}
              </p>
              <p className="context-verse-english">{verse.english}</p>
            </div>
          </li>
        ))}
      </ol>
      {verses.length === 0 ? (
        <div className="context-panel-empty">
          No verses in current scope. Adjust the scope breadcrumb above.
        </div>
      ) : null}
    </>
  );
}

function CitationView({
  citation,
  surahNumber,
}: {
  citation: AnswerCitation;
  surahNumber: number;
}) {
  const { entry, match } = lookupCitation(citation);
  const verseNumber = parseCitationVerse(citation.ref) ?? 0;
  const readerHref =
    verseNumber > 0 ? `/?surah=${surahNumber}#ayah-${verseNumber}` : `/?surah=${surahNumber}`;

  return (
    <div className="context-citation">
      <header className="context-citation-head">
        <span className="context-citation-source">{citation.source}</span>
        <span className="context-citation-author">{citation.author}</span>
        <span className="context-citation-ref">{citation.ref}</span>
      </header>

      <section className="context-citation-snippet">
        <h4 className="context-citation-section-title">Cited passage</h4>
        <p className="context-citation-arabic" dir="rtl" lang="ar">
          {citation.arabic}
        </p>
        <p className="context-citation-english">{citation.english}</p>
      </section>

      {entry ? (
        <section className="context-citation-context">
          <h4 className="context-citation-section-title">Surrounding context</h4>
          <p className="context-citation-verse-arabic" dir="rtl" lang="ar">
            {entry.arabic}
          </p>
          <p className="context-citation-verse-translation">{entry.translation}</p>
          {entry.summary.map((paragraph, idx) => (
            <p key={`s-${idx}`} className="context-citation-summary">
              {paragraph}
            </p>
          ))}
          {match ? (
            <details className="context-citation-fulltext">
              <summary>Full passage in context</summary>
              <p className="context-citation-fulltext-arabic" dir="rtl" lang="ar">
                {match.arabic}
              </p>
              <p className="context-citation-fulltext-english">{match.english}</p>
            </details>
          ) : null}
        </section>
      ) : (
        <section className="context-citation-context">
          <p className="context-citation-fallback">Full passage not available in v3 mock.</p>
        </section>
      )}

      <footer className="context-citation-foot">
        <Link href={readerHref} className="context-citation-link">
          Read full passage in Reader →
        </Link>
        <button
          type="button"
          className="context-citation-clear"
          onClick={() => {
            clearActiveCitation();
            setContextPanelMode("verse");
          }}
        >
          Back to verses
        </button>
      </footer>
    </div>
  );
}
