"use client";

// ReaderModeSwitch — the three-way segmented control in the Topbar that
// switches the reader between interleaved / mushaf / translation.
// Implemented as an ARIA tablist with roving focus so keyboard users can
// cycle modes with ArrowLeft / ArrowRight / Home / End.
//
// We intentionally do not wire `role="tabpanel"` for the panels — the modes
// switch the entire route view rather than swapping a peer panel, so an
// `aria-labelledby` chain to a hidden tabpanel adds no value. Keep it
// minimal: a tablist of buttons that flip a single preference field.

import clsx from "clsx";
import { useCallback, useRef } from "react";

import { AlignLeftIcon, BookIcon, LayersIcon } from "@/components/Icon";
import { usePreferences } from "@/hooks/usePreferences";
import type { ReaderMode } from "@/types";

type ReaderModeOption = {
  value: ReaderMode;
  label: string;
  Icon: typeof BookIcon;
};

const READER_MODE_OPTIONS: readonly ReaderModeOption[] = [
  { value: "interleaved", label: "Interleaved", Icon: LayersIcon },
  { value: "mushaf", label: "Mushaf", Icon: BookIcon },
  { value: "translation", label: "Translation", Icon: AlignLeftIcon },
];

export function ReaderModeSwitch() {
  const { preferences, setPreference } = usePreferences();
  const listRef = useRef<HTMLDivElement>(null);
  const currentIndex = READER_MODE_OPTIONS.findIndex((o) => o.value === preferences.readerMode);
  // If preferences.readerMode somehow falls outside the option set, default
  // to the first tab so roving focus has a deterministic landing spot.
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  const focusTabAt = useCallback((index: number) => {
    const root = listRef.current;
    if (!root) return;
    const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const target = tabs[index];
    target?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const count = READER_MODE_OPTIONS.length;
      let next = safeIndex;
      if (event.key === "ArrowRight") {
        next = (safeIndex + 1) % count;
      } else if (event.key === "ArrowLeft") {
        next = (safeIndex - 1 + count) % count;
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = count - 1;
      } else {
        return;
      }
      event.preventDefault();
      const target = READER_MODE_OPTIONS[next];
      if (!target) return;
      setPreference("readerMode", target.value);
      // Move DOM focus to the new tab so the active descendant matches the
      // visual selection. Run after state flush so the new tabIndex sticks.
      requestAnimationFrame(() => focusTabAt(next));
    },
    [safeIndex, setPreference, focusTabAt],
  );

  // CSS variable drives the indicator's translateX — the indicator div
  // animates between tab positions instead of each button toggling its own
  // background. Keeping the layout calculation in CSS (button width + gap)
  // means changing pill geometry only requires editing globals.css.
  const indicatorStyle = { "--rms-index": safeIndex } as React.CSSProperties;

  return (
    <div
      ref={listRef}
      className="reader-mode-switch"
      role="tablist"
      aria-label="Reader mode"
      onKeyDown={onKeyDown}
      style={indicatorStyle}
    >
      <span className="rms-indicator" aria-hidden="true" />
      {READER_MODE_OPTIONS.map(({ value, label, Icon }, index) => {
        const active = preferences.readerMode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={label}
            title={label}
            tabIndex={index === safeIndex ? 0 : -1}
            className={clsx("rms-btn", active && "on")}
            onClick={() => setPreference("readerMode", value)}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
}
