"use client";

import clsx from "clsx";
import { useCallback, type MouseEvent } from "react";

import type { Surah } from "@/types";

import { AyahAudio } from "./AyahAudio";
import type { AyahSelection } from "./MushafPage";

type Props = {
  surah: Surah;
  selected: number | null;
  recitation: boolean;
  onSelect: (selection: AyahSelection) => void;
};

/**
 * Two-column layout — Arabic on the right, English on the left, aligned
 * per ayah. The row is a single selectable wrapping `<div>` so the tafsir
 * panel + toolbar flow stays mode-agnostic. We avoid `dir="rtl"` on the
 * grid container (which would invert column order in surprising ways for
 * focus and keyboard); instead we set Arabic-specific direction on the
 * Arabic cell only.
 */
export function SideBySideReader({ surah, selected, recitation, onSelect }: Props) {
  const handleSelect = useCallback(
    (n: number, event: MouseEvent<HTMLDivElement>) => {
      onSelect({ n, rect: event.currentTarget.getBoundingClientRect() });
    },
    [onSelect],
  );

  const handleKey = useCallback(
    (n: number, event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onSelect({ n, rect: event.currentTarget.getBoundingClientRect() });
    },
    [onSelect],
  );

  return (
    <div className="sbs-grid">
      {surah.verses.map((verse) => {
        const isSelected = selected === verse.number;
        return (
          <div
            key={verse.number}
            className={clsx("sbs-row", isSelected && "selected")}
            data-ayah={verse.number}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={(event) => handleSelect(verse.number, event)}
            onKeyDown={(event) => handleKey(verse.number, event)}
          >
            <div className="sbs-english">
              <div className="sbs-num">
                {surah.number}:{verse.number}
                {recitation ? (
                  <span className="sbs-audio">
                    <AyahAudio surah={surah.number} ayah={verse.number} />
                  </span>
                ) : null}
              </div>
              <div className="sbs-english-text">{verse.english}</div>
            </div>
            <div className="sbs-arabic" dir="rtl" lang="ar">
              {verse.arabic}
            </div>
          </div>
        );
      })}
    </div>
  );
}
