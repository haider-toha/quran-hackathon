"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icon";
import { usePreferences } from "@/hooks/usePreferences";
import { findSurah, findSurahSummary } from "@/lib/mock-data";
import type { LastRead, Surah } from "@/types";

import { copyToClipboard } from "@/lib/clipboard";
import { showToast } from "@/lib/toast-store";

import { ContinueBanner } from "./ContinueBanner";
import { InterleavedReader } from "./InterleavedReader";
import { MushafPage, type AyahSelection } from "./MushafPage";
import { MushafToolbar, type ToolbarAction } from "./MushafToolbar";
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
  // Don't offer to continue to a surah we can't actually render — the v3
  // corpus is intentionally narrow, and a stale `lastRead` pointer from an
  // earlier session could otherwise produce a banner that links to a
  // missing surah and silently falls back to the default.
  if (!findSurah(lastRead.surah)) return null;
  return lastRead;
}

// Returns `true` once we've hydrated on the client. Same pattern FloatingCard
// uses: SSR returns false, client returns true, no setState-in-effect.
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function Reader({ surah }: Props) {
  const { preferences, setLastRead } = usePreferences();

  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [toolbarRect, setToolbarRect] = useState<DOMRect | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  // Two-phase close: `panelClosing` keeps the TafsirPanel mounted while its
  // slide-out animation plays. We unmount only after the animation ends so
  // the user sees the exit motion. `selectedAyah` is what the rest of the
  // tree (selected verse highlight, focus restore) reads from — it flips to
  // null at the same time as `panelClosing` is set so the verse highlight
  // releases immediately while the panel slides away.
  const [panelClosing, setPanelClosing] = useState(false);
  // Snapshot lastRead at hydration: SSR has no localStorage, so
  // `preferences.lastRead` is null on the server but populated on the client.
  // Computing eagerly with a lazy `useState` initializer would render
  // different HTML on server vs client and trip a hydration mismatch.
  // Gating on `hydrated` ensures the first hydration render matches SSR
  // (both yield null), and the post-hydration render captures the snapshot.
  // The deps array intentionally omits `preferences.lastRead`: we don't want
  // the banner to disappear mid-read when the user taps an ayah on this
  // surah (setLastRead → lastRead.surah === currentSurah → pickContinueRef
  // would return null).
  const hydrated = useHydrated();
  const continueRef = useMemo<LastRead>(
    () => (hydrated ? pickContinueRef(preferences.lastRead, surah.number) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: freeze snapshot at hydration, ignore later lastRead writes
    [hydrated, surah.number],
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
    setToolbarRect(null);
    setPanelClosing(true);
  }, []);

  const handlePanelClosed = useCallback(() => {
    setSelectedAyah(null);
    setPanelClosing(false);
  }, []);

  const handleCloseToolbar = useCallback(() => {
    setToolbarRect(null);
  }, []);

  const handleToolbarAction = useCallback(
    async (action: ToolbarAction) => {
      // The action types are wired up here; the focused panel stays open
      // because `selectedAyah` remains set. We just dismiss the floating bar.
      setToolbarRect(null);
      if (action !== "copy") return;
      if (selectedAyah === null) return;
      const verse = surah.verses.find((v) => v.number === selectedAyah);
      if (!verse) return;
      const ref = `Qur'an ${surah.number}:${verse.number} (${surah.transliteration})`;
      const text = `${verse.arabic}\n\n${verse.english}\n\n— ${ref}`;
      const ok = await copyToClipboard(text);
      showToast(
        ok ? `Copied ${surah.transliteration} ${surah.number}:${verse.number}` : "Couldn't copy",
        { variant: ok ? "success" : "error" },
      );
    },
    [selectedAyah, surah],
  );

  // Escape closes the panel (and any visible toolbar). Empty dep array is
  // safe here: the only references are `setToolbarRect` and `setSelectedAyah`,
  // which React guarantees are referentially stable across renders. We
  // attach once on mount and detach on unmount.
  // Escape dismisses the floating selection toolbar. Panel close-on-Escape
  // is handled inside TafsirPanel itself so its slide-out animation can play
  // (Reader unmounting the panel here would skip the exit animation).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setToolbarRect(null);
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
  // Only run once per surah; we don't want to fight the user's scrolling.
  // Cancellation: if `surah.number` changes mid-frame, the cleanup function
  // both cancels the requestAnimationFrame and flips `cancelled` so the
  // queued callback (if it was already mid-flight on the next frame) does
  // not call `setSelectedAyah` for the previous surah.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#ayah-")) return;
    const n = Number.parseInt(hash.slice("#ayah-".length), 10);
    if (!Number.isFinite(n) || n < 1) return;
    let cancelled = false;
    // Defer one frame so the chosen reader-mode child has rendered.
    const id = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-ayah="${n}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setSelectedAyah(n);
      }
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
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

          {mode === "mushaf" || mode === "interleaved" ? (
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

          {mode === "translation" ? (
            <TranslationLane
              surah={surah}
              selected={selectedAyah}
              recitation={preferences.recitationEnabled}
              onSelect={handleSelectAyah}
            />
          ) : null}

          <nav
            aria-label="Adjacent surahs"
            style={{
              marginTop: 72,
              padding: "20px 0",
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
                display: "inline-flex",
                alignItems: "baseline",
                gap: 10,
                lineHeight: 1.5,
                color: "var(--color-ink-3)",
              }}
            >
              <span
                // Display italic for the name — mirrors the SuraBand hero
                // treatment ("Ad-Duha – The Forenoon") so the foot of the
                // page rhymes with its head.
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 14,
                  color: "var(--color-ink-2)",
                  letterSpacing: "-0.005em",
                }}
              >
                {surah.transliteration}
              </span>
              <span
                // Mono for the meta — same convention as `.sura-no`. Sans
                // would feel weightless next to the display italic.
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-4)",
                }}
              >
                Surah {surah.number} · Juz {surah.juz}
              </span>
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
        <TafsirPanel
          surah={surah}
          ayah={selectedVerse}
          onClose={handleClosePanel}
          closing={panelClosing}
          onClosed={handlePanelClosed}
        />
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
