"use client";

import { useCallback, useEffect, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icon";
import { usePreferences } from "@/lib/preferences-context";
import type { Surah } from "@/types";

import { MushafPage, type AyahSelection } from "./MushafPage";
import { MushafToolbar, type ToolbarAction } from "./MushafToolbar";
import { SuraBand } from "./SuraBand";
import { TafsirPanel } from "./TafsirPanel";
import { TranslationLane } from "./TranslationLane";

type Props = {
  surah: Surah;
};

export function Reader({ surah }: Props) {
  const { preferences } = usePreferences();

  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [toolbarRect, setToolbarRect] = useState<DOMRect | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  const handleSelectAyah = useCallback((selection: AyahSelection) => {
    setSelectedAyah(selection.n);
    setToolbarRect(selection.rect);
  }, []);

  const handleTogglePlay = useCallback((n: number) => {
    setPlaying((current) => (current === n ? null : n));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedAyah(null);
    setToolbarRect(null);
  }, []);

  const handleCloseToolbar = useCallback(() => {
    setToolbarRect(null);
  }, []);

  const handleToolbarAction = useCallback((_action: ToolbarAction) => {
    // The action types are wired up here; the focused panel stays open
    // because `selectedAyah` remains set. We just dismiss the floating bar.
    setToolbarRect(null);
  }, []);

  // Escape closes the panel (and any visible toolbar). Resize is *not*
  // wired up to dismiss the toolbar — mobile address-bar collapse fires
  // resize constantly and would make the toolbar disappear under the user.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setToolbarRect(null);
        setSelectedAyah(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleScroll = useCallback(() => {
    // Reader scroll detaches the fixed-positioned toolbar from its anchor —
    // dismiss it. The selected verse stays selected so the side panel
    // remains open (and the user can re-summon the toolbar by clicking
    // any verse again).
    setToolbarRect((current) => (current ? null : current));
  }, []);

  const showMushaf = preferences.readerMode !== "translation";
  const showTranslation = preferences.readerMode !== "mushaf";
  const selectedVerse =
    selectedAyah !== null ? (surah.verses.find((v) => v.number === selectedAyah) ?? null) : null;

  return (
    <div className="reader-shell">
      <div className="reader" onScroll={handleScroll}>
        <div className="reader-inner">
          <SuraBand surah={surah} />

          {showMushaf && surah.bismillah ? (
            <div className="bismillah" dir="rtl" lang="ar">
              {surah.bismillah}
            </div>
          ) : null}

          {showMushaf ? (
            <MushafPage
              surah={surah}
              selected={selectedAyah}
              playing={playing}
              recitation={preferences.recitation}
              onSelect={handleSelectAyah}
              onPlay={handleTogglePlay}
            />
          ) : null}

          {preferences.marginalia && showMushaf ? (
            <div className="marginalia" style={{ marginTop: 28 }}>
              <span className="lbl">Reflection</span>
              The pause that opens this surah is itself a mercy — what does it teach you about
              silence in your own life?
            </div>
          ) : null}

          {showTranslation ? (
            <TranslationLane surah={surah} selected={selectedAyah} onSelect={handleSelectAyah} />
          ) : null}

          <nav
            aria-label="Adjacent surahs"
            style={{
              marginTop: 56,
              padding: "20px 0",
              borderTop: "1px solid var(--color-line)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button type="button" className="btn ghost" disabled>
              <ChevronLeftIcon size={14} /> Surat Al-Layl · 92
            </button>
            <span style={{ flex: 1 }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--color-ink-4)",
              }}
            >
              {surah.transliteration} · {surah.number} · Juz {surah.juz}
            </span>
            <span style={{ flex: 1 }} />
            <button type="button" className="btn ghost" disabled>
              Surat Ash-Sharḥ · 94 <ChevronRightIcon size={14} />
            </button>
          </nav>
        </div>
      </div>

      {selectedVerse ? (
        <TafsirPanel surah={surah} ayah={selectedVerse} onClose={handleClosePanel} />
      ) : null}

      {toolbarRect ? (
        <MushafToolbar
          rect={toolbarRect}
          onAction={handleToolbarAction}
          onClose={handleCloseToolbar}
        />
      ) : null}
    </div>
  );
}
