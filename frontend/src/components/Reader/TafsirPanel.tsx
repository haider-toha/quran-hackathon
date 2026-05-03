"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { BookmarkIcon, CopyIcon, PenIcon, SparkleIcon, XIcon } from "@/components/Icon";
import { usePreferences } from "@/hooks/usePreferences";
import { parseInline } from "@/lib/markdown";
import { TAFSIR_AD_DUHA } from "@/lib/mock-data";
import type { Surah, TafsirCitation, TafsirEntry, Verse } from "@/types";

import { SourceCard } from "./SourceCard";

type Props = {
  surah: Surah;
  ayah: Verse;
  onClose: () => void;
};

function entryFor(surahNumber: number, ayahNumber: number): TafsirEntry | null {
  if (surahNumber !== 93) return null;
  return TAFSIR_AD_DUHA[ayahNumber] ?? null;
}

export function TafsirPanel({ surah, ayah, onClose }: Props) {
  // We read `showReflectionPrompts` (and nothing else) — v3 renders the
  // canonical Detailed layout regardless of `responseStyle`, so the prior
  // silent read of that field has been dropped.
  const { preferences } = usePreferences();

  const entry = entryFor(surah.number, ayah.number);
  const hasEntry = entry !== null;

  const summaryParagraphs: readonly ReactNode[] = useMemo(
    () =>
      entry ? entry.summary.map((paragraph, index) => parseInline(paragraph, `sum-${index}`)) : [],
    [entry],
  );

  const takeawayItems: readonly ReactNode[] = useMemo(
    () => (entry ? entry.takeaways.map((line, index) => parseInline(line, `tk-${index}`)) : []),
    [entry],
  );

  const drawnFromCitations: readonly TafsirCitation[] = useMemo(
    () => (entry ? entry.citations.slice(0, 2) : []),
    [entry],
  );

  const [openSourceId, setOpenSourceId] = useState<string | null>(
    () => entry?.citations[0]?.id ?? null,
  );

  const toggleSource = useCallback((id: string) => {
    setOpenSourceId((prev) => (prev === id ? null : id));
  }, []);

  // Escape closes the panel — necessary because on viewports ≤ 1100px the
  // panel renders as a modal overlay (CSS media query in globals.css).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside className="tafsir-panel" aria-label="Tafsir explanation">
      <div className="tp-head">
        <span className="tp-ref">
          {surah.number}:{ayah.number}
        </span>
        <span className="tp-title">Explanation</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button type="button" className="iconbtn" title="Pin" aria-label="Pin explanation">
            <BookmarkIcon size={14} />
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={onClose}
            title="Close"
            aria-label="Close explanation"
          >
            <XIcon size={14} />
          </button>
        </div>
      </div>

      <div className="tp-body">
        <div className="tp-ayah-quote" dir="rtl" lang="ar">
          {ayah.arabic}
        </div>
        <div className="tp-ayah-trans">&ldquo;{ayah.english}&rdquo;</div>

        <div className="tp-section">
          <h3>
            <span
              style={{
                display: "inline-flex",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-tafsir)",
              }}
              aria-hidden="true"
            />
            Summary
          </h3>
          <div className="tp-summary">
            {hasEntry ? (
              summaryParagraphs.map((nodes, i) => <p key={`p-${i}`}>{nodes}</p>)
            ) : (
              <p style={{ color: "var(--color-ink-4)" }}>
                No tafsir entry is available for {surah.transliteration} {surah.number}:
                {ayah.number} in the current corpus.
              </p>
            )}
          </div>
        </div>

        {hasEntry ? (
          <div className="tp-section">
            <h3>Three takeaways</h3>
            <ul className="tp-points">
              {takeawayItems.map((nodes, i) => (
                <li key={`tk-${i}`}>
                  <span>{nodes}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hasEntry && entry && preferences.showReflectionPrompts ? (
          <div className="tp-section">
            <div className="tp-marginalia">
              <span className="lbl">Reflection</span>
              {entry.reflection}
            </div>
          </div>
        ) : null}

        {hasEntry ? (
          <div className="tp-section">
            <h3>Drawn from</h3>
            {drawnFromCitations.map((citation) => (
              <SourceCard
                key={citation.id}
                citation={citation}
                open={openSourceId === citation.id}
                onToggle={() => toggleSource(citation.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="tp-foot">
        <button type="button" className="btn primary">
          <PenIcon size={13} /> Save to note
        </button>
        <button type="button" className="btn">
          <SparkleIcon size={13} /> Follow-up
        </button>
        <button
          type="button"
          className="btn ghost"
          style={{ marginLeft: "auto" }}
          aria-label="Copy"
        >
          <CopyIcon size={13} />
        </button>
      </div>
    </aside>
  );
}
