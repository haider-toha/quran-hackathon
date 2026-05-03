"use client";

// ChromeMain — the right-hand main area of the AppShell: topbar, work area
// for `{children}`, plus the floating SurahPicker that the topbar's
// breadcrumb anchors.
//
// Owns two pieces of transient state that don't fit anywhere else:
//   - `surahPickerOpen` — pop-up for the read-target crumb
//   - `surahPickerAnchor` — the anchor element reference that FloatingCard
//     reads positions from. We keep it in state (callback ref) so React can
//     react to it without us reading `.current` during render.
//
// Phase 6 lifted the command-palette state out of this file: the palette
// now mounts at the AppShell root and reads its open/closed state from
// `command-palette-store`. The ⌘K hotkey is registered inside
// `<GlobalCommandPalette />`. `KeyboardShortcuts` here still owns the
// digit / `?` / `,` / `⌘⇧S` / `⌘⇧C` / `⌘/` bindings.
//
// We render `<SurahPicker>` as a sibling of `<main>` rather than inside it:
// `.main` has `overflow: hidden`, and the popover's `position: absolute`
// would be clipped by it.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { SurahPicker } from "@/components/SurahPicker";
import { Topbar } from "@/components/Topbar";
import { DEFAULT_SURAH_NUMBER } from "@/lib/mock-data";

import { KeyboardShortcuts } from "./KeyboardShortcuts";

type Props = {
  children: ReactNode;
};

export function ChromeMain({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);
  // Callback ref for the surah-picker trigger. Storing the element itself
  // (rather than holding `.current`) keeps the Floating-card positioning
  // pure-render-safe — see the Topbar / FloatingCard contract.
  const [surahPickerAnchor, setSurahPickerAnchor] = useState<HTMLButtonElement | null>(null);

  const currentSurah = useMemo<number>(() => {
    const raw = searchParams?.get("surah");
    if (raw === null || raw === undefined) return DEFAULT_SURAH_NUMBER;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return DEFAULT_SURAH_NUMBER;
    return n;
  }, [searchParams]);

  const toggleSurahPicker = useCallback(() => setSurahPickerOpen((o) => !o), []);
  const closeSurahPicker = useCallback(() => setSurahPickerOpen(false), []);
  const onSurahSelect = useCallback(
    (n: number) => {
      // The Reader Server Component reads `?surah=` to look up the surah;
      // this is the only handoff we need.
      router.push(`/?surah=${n}`);
    },
    [router],
  );

  return (
    <>
      <KeyboardShortcuts />
      <main className="main">
        <Topbar
          onSurahPicker={toggleSurahPicker}
          surahPickerActive={surahPickerOpen}
          surahPickerAnchorRef={setSurahPickerAnchor}
        />
        <div className="workarea">{children}</div>
      </main>
      {surahPickerOpen ? (
        <SurahPicker
          anchor={surahPickerAnchor}
          current={currentSurah}
          onClose={closeSurahPicker}
          onSelect={onSurahSelect}
        />
      ) : null}
    </>
  );
}
