"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon } from "@/components/Icon";
import { findSurahSummary } from "@/lib/mock-data";

type Props = {
  options: readonly number[];
  selected: readonly number[];
  onChange: (next: readonly number[]) => void;
};

// Multi-select dropdown of surahs that appear in the user's notes. The list
// of surah numbers is derived in the parent so the dropdown only appears
// when there's at least one surah-linked note.
export function SurahFilter({ options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(surah: number): void {
    if (selected.includes(surah)) {
      onChange(selected.filter((s) => s !== surah));
    } else {
      onChange([...selected, surah]);
    }
  }

  const label =
    selected.length === 0
      ? "Surah"
      : selected.length === 1
        ? `Surah · ${selected[0]}`
        : `Surah · ${selected.length}`;

  return (
    <div className="lib-filter-group">
      <button
        ref={buttonRef}
        type="button"
        className={clsx("lib-filter-button", selected.length > 0 && "on")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((v) => !v)}
        disabled={options.length === 0}
      >
        <span id={labelId}>{label}</span>
        <ChevronDownIcon size={11} />
      </button>
      {open ? (
        <div ref={panelRef} className="lib-filter-panel" role="listbox" aria-multiselectable>
          {options.map((surah) => {
            const summary = findSurahSummary(surah);
            const isSelected = selected.includes(surah);
            return (
              <button
                key={surah}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={clsx("lib-filter-row", isSelected && "on")}
                onClick={() => toggle(surah)}
              >
                <span className="lib-filter-row-mark">
                  {isSelected ? <CheckIcon size={12} /> : null}
                </span>
                <span className="lib-filter-row-label">
                  <span className="lib-filter-row-num">{surah}</span>
                  <span className="lib-filter-row-name">
                    {summary ? summary.transliteration : `Surah ${surah}`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
