"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { CommandPalette } from "@/components/CommandPalette";
import { Sidebar } from "@/components/Sidebar";
import { SurahPicker } from "@/components/SurahPicker";
import { Topbar } from "@/components/Topbar";
import { DEFAULT_SURAH_NUMBER, findSurahSummary, TAFSIR_SOURCES } from "@/lib/mock-data";
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
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);
  const [currentSurah, setCurrentSurah] = useState<number>(DEFAULT_SURAH_NUMBER);
  // Callback ref so we can read the anchor element in state without touching
  // `.current` during render (which React 19 lint rules forbid).
  const [surahPickerAnchor, setSurahPickerAnchor] = useState<HTMLButtonElement | null>(null);

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
            setCurrentSurah(n);
            router.push("/");
          }}
        />
      )}

      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
    </div>
  );
}
