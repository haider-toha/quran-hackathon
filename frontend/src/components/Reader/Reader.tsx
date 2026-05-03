"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icon";
import { findSurahSummary } from "@/lib/mock-data";
import { usePreferences } from "@/hooks/usePreferences";
import type { LastRead, Surah } from "@/types";

import { ContinueBanner } from "./ContinueBanner";
import { InterleavedReader } from "./InterleavedReader";
import { MushafPage, type AyahSelection } from "./MushafPage";
import { MushafToolbar, type ToolbarAction } from "./MushafToolbar";
import { SideBySideReader } from "./SideBySideReader";
import { SuraBand } from "./SuraBand";
import { TafsirPanel } from "./TafsirPanel";
import { TranslationLane } from "./TranslationLane";

type Props = {
  surah: Surah;
};

const LAST_READ_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

type AdjacentSurah = {
  number: number;
  transliteration: string;
};

function findAdjacent(current: number, direction: -1 | 1): AdjacentSurah | null {
  const next = current + direction;
  const summary = findSurahSummary(next);
  if (!summary) return null;
  return { number: summary.number, transliteration: summary.transliteration };
}

function pickContinueRef(lastRead: LastRead, currentSurah: number): LastRead {
  if (!lastRead) return null;
  if (Date.now() - lastRead.timestamp > LAST_READ_FRESHNESS_MS) return null;
  if (lastRead.surah === currentSurah) return null;
  return lastRead;
}

export function Reader({ surah }: Props) {
  const { preferences, setLastRead } = usePreferences();

  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [toolbarRect, setToolbarRect] = useState<DOMRect | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  // Snapshot at mount: we don't want the banner flickering after the user
  // taps an ayah on this surah (which would update preferences.lastRead and
  // therefore satisfy the new condition for *this* surah). The lazy
  // initializer keeps the snapshot stable for the lifetime of this Reader.
  const [continueRef] = useState<LastRead>(() =>
    pickContinueRef(preferences.lastRead, surah.number),
  );

  const handleSelectAyah = useCallback(
    (selection: AyahSelection) => {
      setSelectedAyah(selection.n);
      setToolbarRect(selection.rect);
      setLastRead({ surah: surah.number, ayah: selection.n });
    },
    [setLastRead, surah.number],
  );

  const handleTogglePlay = useCallback(
    (n: number) => {
      setPlaying((current) => (current === n ? null : n));
      // Treat "started playing" as a read — we record the verse pointer so
      // continue-reading still works for users who listen rather than tap.
      setLastRead({ surah: surah.number, ayah: n });
    },
    [setLastRead, surah.number],
  );

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

  // After mount, scroll to the deep-link target if the URL has `#ayah-N`.
  // Only run once; we don't want to fight the user's scrolling.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#ayah-")) return;
    const n = Number.parseInt(hash.slice("#ayah-".length), 10);
    if (!Number.isFinite(n) || n < 1) return;
    // Defer one frame so the chosen reader-mode child has rendered.
    const id = window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-ayah="${n}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setSelectedAyah(n);
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [surah.number]);

  const selectedVerse =
    selectedAyah !== null ? (surah.verses.find((v) => v.number === selectedAyah) ?? null) : null;

  const prev = findAdjacent(surah.number, -1);
  const next = findAdjacent(surah.number, 1);

  const mode = preferences.readerMode;

  return (
    <div className="reader-shell">
      <div className="reader" onScroll={handleScroll}>
        <div className="reader-inner">
          {continueRef ? (
            <ContinueBanner surah={continueRef.surah} ayah={continueRef.ayah} />
          ) : null}

          <SuraBand surah={surah} />

          {mode === "mushaf" || mode === "interleaved" || mode === "side-by-side" ? (
            surah.bismillah ? (
              <div className="bismillah" dir="rtl" lang="ar">
                {surah.bismillah}
              </div>
            ) : null
          ) : null}

          {mode === "mushaf" ? (
            <MushafPage
              surah={surah}
              selected={selectedAyah}
              playing={playing}
              recitation={preferences.recitationEnabled}
              onSelect={handleSelectAyah}
              onPlay={handleTogglePlay}
            />
          ) : null}

          {mode === "interleaved" ? (
            <InterleavedReader
              surah={surah}
              selected={selectedAyah}
              recitation={preferences.recitationEnabled}
              onSelect={handleSelectAyah}
            />
          ) : null}

          {mode === "side-by-side" ? (
            <SideBySideReader
              surah={surah}
              selected={selectedAyah}
              recitation={preferences.recitationEnabled}
              onSelect={handleSelectAyah}
            />
          ) : null}

          {mode === "translation" ? (
            <TranslationLane
              surah={surah}
              selected={selectedAyah}
              recitation={preferences.recitationEnabled}
              onSelect={handleSelectAyah}
            />
          ) : null}

          {preferences.showReflectionPrompts && mode === "mushaf" ? (
            <div className="marginalia" style={{ marginTop: 28 }}>
              <span className="lbl">Reflection</span>
              The pause that opens this surah is itself a mercy — what does it teach you about
              silence in your own life?
            </div>
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
            {prev ? (
              <Link className="btn ghost" href={`/?surah=${prev.number}`}>
                <ChevronLeftIcon size={14} /> Surat {prev.transliteration} · {prev.number}
              </Link>
            ) : (
              <button type="button" className="btn ghost" disabled>
                <ChevronLeftIcon size={14} />
              </button>
            )}
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
            {next ? (
              <Link className="btn ghost" href={`/?surah=${next.number}`}>
                Surat {next.transliteration} · {next.number} <ChevronRightIcon size={14} />
              </Link>
            ) : (
              <button type="button" className="btn ghost" disabled>
                <ChevronRightIcon size={14} />
              </button>
            )}
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
