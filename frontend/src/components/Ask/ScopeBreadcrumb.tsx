"use client";

// ScopeBreadcrumb — the canonical "what is the AI looking at" affordance.
// Format: `Quran › Juz Amma › Ad-Duha › Verses 1–11`. Each segment is
// clickable and opens a picker to widen or narrow the active scope.
//
// The "Quran" and "Juz Amma" segments are no-ops in v3 because the corpus is
// just Juz Amma; clicking either opens the surah picker (the next-narrowest
// useful pivot). The surah segment opens the existing SurahPicker so the
// affordance matches the topbar Reader crumb. The verse-range segment opens
// a small custom popover with start/end number inputs.
//
// Renders next to it the SourcesChip (`N sources active`) so the two
// "what's the AI looking at + which commentaries" controls live as a pair.

import { useCallback, useRef, useState } from "react";

import { ChevronRightIcon } from "@/components/Icon";
import { SurahPicker } from "@/components/SurahPicker";
import { useOnOutsideInteraction } from "@/hooks/useOnOutsideInteraction";
import { findSurah, findSurahSummary } from "@/lib/mock-data";
import { makeScope, useScope, useScopeSetter } from "@/lib/scope-context";
import { closeScopePicker, openScopePicker, useScopePickerOpen } from "@/lib/scope-picker-store";

import { SourcesChip } from "./SourcesChip";

export function ScopeBreadcrumb() {
  const scope = useScope();
  const setScope = useScopeSetter();

  const pickerOpen = useScopePickerOpen();
  const [versesOpen, setVersesOpen] = useState(false);

  // Anchor elements stored in state via callback refs so the picker /
  // popover positioning is React-tracked. The standard ref + .current read
  // during render would trip the react-hooks/refs lint rule and risk
  // returning a stale anchor on the first render after mount.
  const [surahAnchorEl, setSurahAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [verseAnchorEl, setVerseAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleSurahSelect = useCallback(
    (surahNumber: number) => {
      const summary = findSurahSummary(surahNumber);
      if (!summary) return;
      // Juz lives on the full Surah, not the summary catalogue. Fall back to
      // the current scope's juz so a corpus row missing the full record
      // (shouldn't happen in v3 but the lookup is total) doesn't blank out
      // the breadcrumb's juz segment.
      const full = findSurah(surahNumber);
      const juz = full?.juz ?? scope.juz;
      setScope(
        makeScope({
          surahNumber: summary.number,
          surahLabel: summary.transliteration,
          range: { start: 1, end: summary.verseCount },
          juz,
          juzLabel: scope.juzLabel,
        }),
      );
    },
    [setScope, scope.juzLabel, scope.juz],
  );

  const handleVerseRangeChange = useCallback(
    (range: { start: number; end: number }) => {
      setScope(
        makeScope({
          surahNumber: scope.surahNumber,
          surahLabel: scope.surahLabel,
          range,
          juz: scope.juz,
          juzLabel: scope.juzLabel,
        }),
      );
    },
    [setScope, scope.surahNumber, scope.surahLabel, scope.juz, scope.juzLabel],
  );

  const verseLabel =
    scope.range.start === scope.range.end
      ? `Verse ${scope.range.start}`
      : `Verses ${scope.range.start}–${scope.range.end}`;

  // Verse count for clamping the verse-range editor. Falls back to 286 (the
  // longest surah) when the summary lookup misses, so the editor never locks
  // the user out of a valid range.
  const verseCount = findSurahSummary(scope.surahNumber)?.verseCount ?? 286;

  return (
    <nav className="scope-bar" aria-label="Active scope">
      <ol className="scope-crumbs">
        <li className="scope-crumb">
          <button
            ref={setSurahAnchorEl}
            type="button"
            className="scope-crumb-btn root"
            onClick={() => openScopePicker()}
          >
            Quran
          </button>
        </li>
        <Sep />
        <li className="scope-crumb">
          <button type="button" className="scope-crumb-btn" onClick={() => openScopePicker()}>
            {scope.juzLabel}
          </button>
        </li>
        <Sep />
        <li className="scope-crumb">
          <button type="button" className="scope-crumb-btn" onClick={() => openScopePicker()}>
            {scope.surahLabel}
          </button>
        </li>
        <Sep />
        <li className="scope-crumb">
          <button
            ref={setVerseAnchorEl}
            type="button"
            className="scope-crumb-btn current"
            onClick={() => setVersesOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={versesOpen}
          >
            {verseLabel}
          </button>
        </li>
      </ol>

      <SourcesChip />

      {pickerOpen ? (
        <SurahPicker
          anchor={surahAnchorEl}
          current={scope.surahNumber}
          onClose={closeScopePicker}
          onSelect={(n) => {
            handleSurahSelect(n);
            closeScopePicker();
          }}
        />
      ) : null}

      {versesOpen ? (
        <VerseRangePicker
          anchor={verseAnchorEl}
          range={scope.range}
          maxVerse={verseCount}
          onApply={(range) => {
            handleVerseRangeChange(range);
            setVersesOpen(false);
          }}
          onClose={() => setVersesOpen(false)}
        />
      ) : null}
    </nav>
  );
}

function Sep() {
  return (
    <li className="scope-sep" aria-hidden>
      <ChevronRightIcon size={11} />
    </li>
  );
}

type VerseRangePickerProps = {
  anchor: HTMLElement | null;
  range: { start: number; end: number };
  maxVerse: number;
  onApply: (range: { start: number; end: number }) => void;
  onClose: () => void;
};

function VerseRangePicker({ anchor, range, maxVerse, onApply, onClose }: VerseRangePickerProps) {
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);

  const containerRef = useRef<HTMLDivElement>(null);
  useOnOutsideInteraction(containerRef, onClose);

  // Position the popover under the verse segment. The crumb buttons live in
  // a flex row, so a viewport rect is the simplest source of truth.
  const rect = anchor?.getBoundingClientRect();
  const top = rect ? rect.bottom + 6 : 0;
  const left = rect ? rect.left : 0;

  const handleApply = useCallback(() => {
    const s = Math.max(1, Math.min(maxVerse, Math.floor(start)));
    const e = Math.max(s, Math.min(maxVerse, Math.floor(end)));
    onApply({ start: s, end: e });
  }, [start, end, maxVerse, onApply]);

  return (
    <div
      ref={containerRef}
      className="verse-range-picker"
      role="dialog"
      aria-label="Pick verse range"
      style={{ top, left }}
    >
      <div className="vrp-row">
        <label className="vrp-field">
          <span>From</span>
          <input
            type="number"
            min={1}
            max={maxVerse}
            value={start}
            onChange={(e) => setStart(Number.parseInt(e.target.value, 10) || 1)}
          />
        </label>
        <span className="vrp-sep">—</span>
        <label className="vrp-field">
          <span>To</span>
          <input
            type="number"
            min={start}
            max={maxVerse}
            value={end}
            onChange={(e) => setEnd(Number.parseInt(e.target.value, 10) || start)}
          />
        </label>
      </div>
      <div className="vrp-foot">
        <span className="vrp-meta">Surah has {maxVerse} verses</span>
        <button type="button" className="btn primary sm" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
