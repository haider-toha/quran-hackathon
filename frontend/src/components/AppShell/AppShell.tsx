"use client";

import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { CommandPalette } from "@/components/CommandPalette";
import { Sidebar } from "@/components/Sidebar";
import { SurahPicker } from "@/components/SurahPicker";
import { Topbar } from "@/components/Topbar";
import { DEFAULT_SURAH_NUMBER, findSurahSummary, TAFSIR_SOURCES } from "@/lib/mock-data";
import { usePreferences } from "@/lib/preferences-context";
import type { AppRoute } from "@/types";

const SHORTCUT_TARGETS: Readonly<Record<string, AppRoute>> = {
  "1": "/",
  "2": "/ask",
  "3": "/journal",
  "4": "/library",
  "5": "/research",
  ",": "/settings",
};

const SOURCE_COUNT = {
  active: TAFSIR_SOURCES.filter((s) => s.enabledByDefault).length,
  total: TAFSIR_SOURCES.length,
};

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { preferences } = usePreferences();
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);
  // Source of truth for the active surah is the URL `?surah=` searchParam.
  // We mirror it into `surahLabel` for the topbar; we don't track it as
  // mutable state here.
  const currentSurah = useMemo<number>(() => {
    const raw = searchParams?.get("surah");
    if (raw === null || raw === undefined) return DEFAULT_SURAH_NUMBER;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return DEFAULT_SURAH_NUMBER;
    return n;
  }, [searchParams]);
  // Callback ref so we can read the anchor element in state without touching
  // `.current` during render (which React 19 lint rules forbid).
  const [surahPickerAnchor, setSurahPickerAnchor] = useState<HTMLButtonElement | null>(null);

  // Onboarding gate. We capture the most recently requested redirect target in
  // a ref so we don't issue the same router.push() multiple times while the
  // route transition is settling — issuing /onboarding twice is harmless, but
  // re-issuing it after the user navigates away mid-flow would tug them back.
  const lastRedirectRef = useRef<string | null>(null);
  const onOnboarding = pathname === "/onboarding";
  useEffect(() => {
    let target: "/onboarding" | "/" | null = null;
    if (!onOnboarding && preferences.onboarded === false) target = "/onboarding";
    if (onOnboarding && preferences.onboarded === true) target = "/";

    if (target === null) {
      lastRedirectRef.current = null;
      return;
    }
    if (lastRedirectRef.current === target) return;
    lastRedirectRef.current = target;
    router.push(target);
  }, [onOnboarding, preferences.onboarded, router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      const target = SHORTCUT_TARGETS[event.key];
      if (target) {
        event.preventDefault();
        router.push(target);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const onCollapseToggle = useCallback(() => setCollapsed((c) => !c), []);

  const surahLabel = (() => {
    const summary = findSurahSummary(currentSurah);
    if (!summary) return `Surah ${currentSurah}`;
    return `${summary.transliteration} · ${summary.number}`;
  })();

  // Onboarding renders without the shell chrome — the flow has its own header
  // (brand + step pips + skip) and would fight with the sidebar/topbar.
  if (onOnboarding) {
    return <div className="onboarding-root">{children}</div>;
  }

  return (
    <div className={clsx("shell", collapsed && "collapsed")}>
      <Sidebar
        collapsed={collapsed}
        onCollapseToggle={onCollapseToggle}
        sourceCount={SOURCE_COUNT}
      />
      <main className="main">
        <Topbar
          surahLabel={surahLabel}
          onCommandPalette={() => setCommandOpen(true)}
          onSurahPicker={() => setSurahPickerOpen((o) => !o)}
          surahPickerActive={surahPickerOpen}
          surahPickerAnchorRef={setSurahPickerAnchor}
        />
        <div className="workarea">{children}</div>
      </main>

      {surahPickerOpen && (
        <SurahPicker
          anchor={surahPickerAnchor}
          current={currentSurah}
          onClose={() => setSurahPickerOpen(false)}
          onSelect={(n) => {
            // The Reader Server Component reads `?surah=` to look up the
            // surah; this is the only handoff we need.
            router.push(`/?surah=${n}`);
          }}
        />
      )}

      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
    </div>
  );
}
