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

const TAFSIR_WIDTH_KEY = "mishkat:tafsir-width:v1";
const MIN_WIDTH = 360;
const MAX_WIDTH = 760;
const DEFAULT_WIDTH = 460;

function readStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  try {
    const raw = window.localStorage.getItem(TAFSIR_WIDTH_KEY);
    if (!raw) return DEFAULT_WIDTH;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return DEFAULT_WIDTH;
    const viewportMax = Math.floor(window.innerWidth * 0.5);
    return Math.min(MAX_WIDTH, viewportMax, Math.max(MIN_WIDTH, n));
  } catch {
    return DEFAULT_WIDTH;
  }
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

  const reflectionNodes: readonly ReactNode[] = useMemo(
    () => (entry ? parseInline(entry.reflection, "ref") : []),
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

  // Resizable panel width — persisted to localStorage so the user's chosen
  // width survives session and surah changes. Lazy initializer is safe here
  // because TafsirPanel only mounts post-hydration (gated by selectedAyah,
  // which starts null in the parent), so server/client first render disagree
  // in a regime React can't even compare.
  const [panelWidth, setPanelWidth] = useState<number>(readStoredWidth);

  // Mirror the live width onto a root CSS variable so the topbar (which
  // shrinks via `padding-right`) and the reader (which gains
  // `padding-right`) leave room for the fixed-positioned panel. Cleared
  // on unmount so the topbar/reader spring back to full width when the
  // panel closes.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--tafsir-panel-w", `${panelWidth}px`);
    return () => {
      root.style.removeProperty("--tafsir-panel-w");
    };
  }, [panelWidth]);

  const handleResizePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const handle = event.currentTarget;
    const panel = handle.parentElement;
    if (!panel) return;
    const startX = event.clientX;
    const startWidth = panel.getBoundingClientRect().width;
    const viewportMax = Math.floor(window.innerWidth * 0.5);
    const upperBound = Math.min(MAX_WIDTH, viewportMax);
    let lastWidth = startWidth;

    handle.classList.add("dragging");
    // Block text selection while dragging — without this, dragging across
    // the reader grabs verse text.
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    function onMove(ev: PointerEvent) {
      // Dragging left (clientX decreases) should grow the panel since the
      // handle sits on the panel's left edge.
      const delta = startX - ev.clientX;
      lastWidth = Math.min(upperBound, Math.max(MIN_WIDTH, startWidth + delta));
      setPanelWidth(lastWidth);
    }
    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      handle.classList.remove("dragging");
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = "";
      try {
        window.localStorage.setItem(TAFSIR_WIDTH_KEY, String(Math.round(lastWidth)));
      } catch {
        // Quota / privacy mode — preference won't persist this session.
      }
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, []);

  return (
    <aside className="tafsir-panel" style={{ width: panelWidth }} aria-label="Tafsir explanation">
      <div
        className="tp-resize"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize explanation panel"
        onPointerDown={handleResizePointerDown}
      />
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
              {reflectionNodes}
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
