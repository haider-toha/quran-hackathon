"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";

import { ChevronDownIcon, MoonIcon, QuestionIcon, SearchIcon, SunIcon } from "@/components/Icon";
import { usePreferences } from "@/lib/preferences-context";

import { Crumbs } from "./Crumbs";

type Props = {
  surahLabel: string;
  onCommandPalette: () => void;
  onSurahPicker: () => void;
  surahPickerActive: boolean;
  surahPickerAnchorRef: (el: HTMLButtonElement | null) => void;
};

export function Topbar({
  surahLabel,
  onCommandPalette,
  onSurahPicker,
  surahPickerActive,
  surahPickerAnchorRef,
}: Props) {
  const pathname = usePathname();
  const { preferences, toggleTheme } = usePreferences();
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

      <button
        type="button"
        className="searchbar"
        onClick={onCommandPalette}
        aria-label="Open command palette"
      >
        <SearchIcon size={13} />
        <span>Search verses, notes, sources…</span>
        <span className="kbd">⌘K</span>
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
