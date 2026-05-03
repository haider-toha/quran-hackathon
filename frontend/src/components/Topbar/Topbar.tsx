"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";

import {
  AlignLeftIcon,
  BookIcon,
  ChevronDownIcon,
  ColumnsIcon,
  LayersIcon,
  MoonIcon,
  QuestionIcon,
  SearchIcon,
  SunIcon,
} from "@/components/Icon";
import { useAdminMode } from "@/lib/flags";
import { kbdChord } from "@/lib/kbd";
import { usePreferences } from "@/lib/preferences-context";
import type { ReaderMode } from "@/types";

import { Crumbs } from "./Crumbs";
import { NotificationsBell } from "./NotificationsBell";

type Props = {
  surahLabel: string;
  onCommandPalette: () => void;
  onSurahPicker: () => void;
  surahPickerActive: boolean;
  surahPickerAnchorRef: (el: HTMLButtonElement | null) => void;
};

type ReaderModeOption = {
  value: ReaderMode;
  label: string;
  Icon: typeof BookIcon;
};

const READER_MODE_OPTIONS: readonly ReaderModeOption[] = [
  { value: "interleaved", label: "Interleaved", Icon: LayersIcon },
  { value: "mushaf", label: "Mushaf", Icon: BookIcon },
  { value: "translation", label: "Translation", Icon: AlignLeftIcon },
  { value: "side-by-side", label: "Side by side", Icon: ColumnsIcon },
];

export function Topbar({
  surahLabel,
  onCommandPalette,
  onSurahPicker,
  surahPickerActive,
  surahPickerAnchorRef,
}: Props) {
  const pathname = usePathname();
  const { preferences, toggleTheme, setPreference } = usePreferences();
  const { admin } = useAdminMode();
  const isReader = pathname === "/";

  return (
    <header className="topbar">
      {isReader ? (
        <div className="crumbs">
          <span>Read</span>
          <span className="sep">›</span>
          <button
            ref={surahPickerAnchorRef}
            type="button"
            className={clsx("btn", "ghost", "sm")}
            style={{ fontSize: 13, height: 26, padding: "0 8px" }}
            onClick={onSurahPicker}
            aria-expanded={surahPickerActive}
            aria-haspopup="dialog"
          >
            <span className="current" style={{ color: "var(--color-ink)" }}>
              {surahLabel}
            </span>
            <ChevronDownIcon size={13} />
          </button>
        </div>
      ) : (
        <Crumbs pathname={pathname} />
      )}

      <div className="spacer" />

      {/* Reader-only segmented control: gated on `pathname === "/"` because
          the four modes only make sense while the Reader is mounted. */}
      {isReader ? (
        <div className="reader-mode-switch" role="group" aria-label="Reader mode">
          {READER_MODE_OPTIONS.map(({ value, label, Icon }) => {
            const active = preferences.readerMode === value;
            return (
              <button
                key={value}
                type="button"
                className={clsx("rms-btn", active && "on")}
                aria-pressed={active}
                aria-label={label}
                title={label}
                onClick={() => setPreference("readerMode", value)}
              >
                <Icon size={13} />
              </button>
            );
          })}
        </div>
      ) : null}

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
      <button type="button" className="iconbtn" aria-label="Help">
        <QuestionIcon size={15} />
      </button>
    </header>
  );
}
