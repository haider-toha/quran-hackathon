"use client";

import { usePathname } from "next/navigation";

import { SurahCrumb } from "@/components/AppShell";
import { MoonIcon, SearchIcon, SunIcon } from "@/components/Icon";
import { useAdminMode } from "@/hooks/useAdminMode";
import { kbdChord } from "@/lib/kbd";
import { usePreferences } from "@/hooks/usePreferences";

import { Crumbs } from "./Crumbs";
import { NotificationsBell } from "./NotificationsBell";
import { ReaderModeSwitch } from "./ReaderModeSwitch";

type Props = {
  onCommandPalette: () => void;
  onSurahPicker: () => void;
  surahPickerActive: boolean;
  surahPickerAnchorRef: (el: HTMLButtonElement | null) => void;
};

export function Topbar({
  onCommandPalette,
  onSurahPicker,
  surahPickerActive,
  surahPickerAnchorRef,
}: Props) {
  const pathname = usePathname();
  const { preferences, toggleTheme } = usePreferences();
  const { admin } = useAdminMode();
  const isReader = pathname === "/";

  return (
    <header className="topbar">
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

      {/* Notifications bell — Wave 2F. Sits just before the command palette
          on the right side of the topbar. Popover lives inside the bell. */}
      <NotificationsBell />

      <button
        type="button"
        className="searchbar"
        onClick={onCommandPalette}
        aria-label="Open command palette"
      >
        <SearchIcon size={13} />
        <span>Search verses, notes, sources…</span>
        <span className="kbd">{kbdChord("cmd", "K")}</span>
      </button>

      <button
        type="button"
        className="iconbtn"
        onClick={toggleTheme}
        aria-label={preferences.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      >
        {preferences.theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
      </button>
    </header>
  );
}
