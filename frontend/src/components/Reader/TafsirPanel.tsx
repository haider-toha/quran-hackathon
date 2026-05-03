"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { BookmarkIcon, CopyIcon, PenIcon, SparkleIcon, XIcon } from "@/components/Icon";
import { TAFSIR_93_3 } from "@/lib/mock-data";
import { usePreferences } from "@/lib/preferences-context";
import type { Surah, TafsirCitation, Verse } from "@/types";

import { parseInlineMarkdown } from "./inline-markdown";
import { SourceCard } from "./SourceCard";

// Hoisted out of render — these are pure functions of TAFSIR_93_3 (a module
// constant) and don't need to live behind a useMemo.
const FOCAL_SUMMARY = TAFSIR_93_3.summary.map((p, i) => parseInlineMarkdown(p, `sum-${i}`));
const FOCAL_TAKEAWAYS = TAFSIR_93_3.takeaways.map((p, i) => parseInlineMarkdown(p, `tk-${i}`));
const DRAWN_FROM_CITATIONS: readonly TafsirCitation[] = TAFSIR_93_3.citations.slice(0, 2);

type Props = {
  surah: Surah;
  ayah: Verse;
  onClose: () => void;
};

export function TafsirPanel({ surah, ayah, onClose }: Props) {
  // Read responseStyle silently — v3 renders the canonical Detailed layout
  // regardless of style. The pref still informs server-side response shape.
  // TODO(v3.1): branch on responseStyle for actual content variants
  const { preferences } = usePreferences();

  const [openSourceId, setOpenSourceId] = useState<string | null>(
    TAFSIR_93_3.citations[0]?.id ?? null,
  );

  const isFocal = surah.number === 93 && ayah.number === 3;
  const summaryParagraphs: readonly ReactNode[] = isFocal ? FOCAL_SUMMARY : [];
  const takeawayItems: readonly ReactNode[] = isFocal ? FOCAL_TAKEAWAYS : [];
  const drawnFromCitations = DRAWN_FROM_CITATIONS;

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
            {isFocal ? (
              summaryParagraphs.map((nodes, i) => <p key={`p-${i}`}>{nodes}</p>)
            ) : (
              <p style={{ color: "var(--color-ink-4)" }}>
                Open this ayah&apos;s tafsir to see the classical commentary. Sample explanation
                appears for {surah.transliteration} 93:3.
              </p>
            )}
          </div>
        </div>

        {isFocal ? (
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

        {isFocal && preferences.showReflectionPrompts ? (
          <div className="tp-section">
            <div className="tp-marginalia">
              <span className="lbl">Reflection</span>
              {TAFSIR_93_3.reflection}
            </div>
          </div>
        ) : null}

        {isFocal ? (
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
