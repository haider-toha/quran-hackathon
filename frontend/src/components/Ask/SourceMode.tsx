"use client";

import clsx from "clsx";
import { useState } from "react";

import { CheckIcon, PlusIcon } from "@/components/Icon";

type SourceKey = "tafsir" | "quran" | "notes" | "external";

type SourceOption = {
  key: SourceKey;
  label: string;
};

const OPTIONS: readonly SourceOption[] = [
  { key: "tafsir", label: "Tafsir" },
  { key: "quran", label: "Quran" },
  { key: "notes", label: "My notes" },
  { key: "external", label: "External" },
];

const DEFAULT_SELECTED: Readonly<Record<SourceKey, boolean>> = {
  tafsir: true,
  quran: true,
  notes: false,
  external: false,
};

/**
 * Additive multi-select chip row for the Ask screen. Defaults to Tafsir +
 * Quran on; My notes and External off. The selection is purely visual for
 * the prototype — no upstream state is wired yet.
 */
export function SourceMode() {
  const [selected, setSelected] = useState<Record<SourceKey, boolean>>(DEFAULT_SELECTED);

  function toggle(key: SourceKey) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="source-mode">
      <span className="lbl">Sources</span>
      {OPTIONS.map((option) => {
        const on = selected[option.key];
        return (
          <button
            type="button"
            key={option.key}
            className={clsx("opt", on && "on")}
            onClick={() => toggle(option.key)}
            aria-pressed={on}
          >
            {on ? <CheckIcon size={11} /> : <PlusIcon size={11} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
