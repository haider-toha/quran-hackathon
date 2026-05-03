"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";

import { SurahCrumb } from "@/components/AppShell";
import { AlignLeftIcon, ColumnsIcon, MapIcon, MoonIcon, SunIcon } from "@/components/Icon";
import { useJournalChrome } from "@/components/Journal/JournalChromeContext";
import { useAdminMode } from "@/hooks/useAdminMode";
import { kbdChord } from "@/lib/kbd";
import { usePreferences } from "@/hooks/usePreferences";

import { Crumbs } from "./Crumbs";
import { ReaderModeSwitch } from "./ReaderModeSwitch";

type Props = {
  onSurahPicker: () => void;
  surahPickerActive: boolean;
  surahPickerAnchorRef: (el: HTMLButtonElement | null) => void;
};

// Phase 6 — the topbar now hosts only the breadcrumbs / mode switch /
// theme toggle. The search input is gone; the global ⌘K palette and the
// sidebar's search icon take its place. The notifications bell relocated
// to the bottom of the sidebar so the topbar can recede on every route.
//
// What this means for the layout:
//   - The topbar's right edge holds the journal mode switch (when a
//     JournalV2 is mounted), the admin pill (when admin mode is on), and
//     a chromeless theme toggle.
//   - Reader and Journal still expose their own controls (ReaderModeSwitch,
//     JournalModeSwitch). Those stay because they aren't general chrome.

export function Topbar({ onSurahPicker, surahPickerActive, surahPickerAnchorRef }: Props) {
  const pathname = usePathname();
  const { preferences, toggleTheme } = usePreferences();
  const { admin } = useAdminMode();
  const journalChrome = useJournalChrome();
  const isReader = pathname === "/";

  // Journal mode switcher is gated on `journalChrome.active` (a v2-flag-on
  // JournalV2 is currently mounted). Other routes never see the widget.
  const journalActive = journalChrome.active;
  // Phase 10 — surface the route so globals.css can dim the notifications
  // bell on /library. Keeping the rule in CSS rather than branching the
  // bell itself keeps Topbar's render path one component shorter.
  const onLibrary = pathname.startsWith("/library");

  return (
    <header
      className={clsx("topbar", journalActive && "topbar-journal-v2")}
      data-on-library={onLibrary ? "true" : undefined}
    >
      {isReader ? (
        <SurahCrumb
          onSurahPicker={onSurahPicker}
          surahPickerActive={surahPickerActive}
          surahPickerAnchorRef={surahPickerAnchorRef}
        />
      ) : (
        <Crumbs pathname={pathname} />
      )}

      <div className="spacer" />

      {/* Reader-only segmented control: gated on `pathname === "/"` because
          the four modes only make sense while the Reader is mounted. */}
      {isReader ? <ReaderModeSwitch /> : null}

      {/* Journal-only mode switcher: visible while a JournalV2 instance is
          mounted (i.e. on /journal with the v2 flag on). Toggles between
          compose (writing-dominant) and connect (3-column) layouts. */}
      {journalActive ? <JournalModeSwitch /> : null}

      {/* Admin pill — Wave 2A. Visible only when admin mode is on. */}
      {admin ? (
        <span
          className="topbar-admin-pill"
          title="Admin mode on (⌘⇧·)"
          aria-label="Admin mode on. Toggle with Command Shift Period."
        >
          Admin
        </span>
      ) : null}

      {/* Phase 6 — theme toggle is chromeless: just the icon, no border or
          background. The shared `.theme-toggle` class plus the new
          `.minimal` modifier strip the iconbtn frame while preserving the
          hover-opacity treatment. */}
      <button
        type="button"
        className="theme-toggle minimal"
        onClick={toggleTheme}
        aria-label={preferences.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      >
        {/* `key` forces a remount on theme change so the entrance animation
            replays. The wrapper carries the rotate+fade keyframes. */}
        <span key={preferences.theme} className="theme-icon-swap" aria-hidden="true">
          {preferences.theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </span>
      </button>
    </header>
  );
}

/**
 * Tiny segmented control: AlignLeftIcon (sparse — Compose), ColumnsIcon
 * (3-column — Connect), MapIcon (radial graph — Map). Lives in the
 * topbar's right cluster while a v2 JournalV2 is mounted. Mode is
 * read/written through the same store the page itself uses, so the
 * topbar control is a peer to the keyboard shortcut, not a separate state.
 *
 * Phase 8 adds the third Map button; the cycle order matches `⌘.`'s
 * compose → connect → map → compose path.
 */
function JournalModeSwitch() {
  const { mode, setChrome } = useJournalChrome();

  type Mode = "compose" | "connect" | "map";

  // The chrome context is the source of truth that fans state out to the
  // sidebar/topbar/page. We never write the persisted mode from here —
  // instead, we synthesise a global keyboard event that JournalV2's
  // listener picks up. Doing it this way keeps the persistence path
  // (per-note localStorage) inside JournalV2, where the noteId lives.
  function handleClick(next: Mode) {
    if (mode === next) return;
    // Optimistic chrome update so the sidebar/topbar respond before the
    // journal page's own handler runs. JournalV2's effect re-asserts the
    // value on next render.
    setChrome({ active: true, mode: next });
    document.dispatchEvent(
      new CustomEvent<{ mode: Mode }>("mishkat:journal-set-mode", {
        detail: { mode: next },
      }),
    );
  }

  return (
    <div className="journal-mode-switch" role="group" aria-label="Journal layout">
      <button
        type="button"
        className={clsx("journal-mode-switch-btn", mode === "compose" && "is-active")}
        onClick={() => handleClick("compose")}
        aria-pressed={mode === "compose"}
        aria-label="Compose layout"
        title={`Compose · ${kbdChord("cmd", ".")}`}
      >
        <AlignLeftIcon size={14} />
      </button>
      <button
        type="button"
        className={clsx("journal-mode-switch-btn", mode === "connect" && "is-active")}
        onClick={() => handleClick("connect")}
        aria-pressed={mode === "connect"}
        aria-label="Connect layout"
        title={`Connect · ${kbdChord("cmd", ".")}`}
      >
        <ColumnsIcon size={14} />
      </button>
      <button
        type="button"
        className={clsx("journal-mode-switch-btn", mode === "map" && "is-active")}
        onClick={() => handleClick("map")}
        aria-pressed={mode === "map"}
        aria-label="Map layout"
        title={`Map · ${kbdChord("cmd", ".")}`}
      >
        <MapIcon size={14} />
      </button>
    </div>
  );
}
