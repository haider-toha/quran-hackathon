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
 * Interleaved layout — the v3 default. Each verse is a stacked pair: the
 * Arabic line on top, the translation directly under, separated by generous
 * vertical spacing (no rule between pairs). The whole pair is a single
 * selectable unit so the toolbar/tafsir flow is identical to the other
 * three reader modes; the toolbar reads `getBoundingClientRect()` on the
 * outer `<div data-ayah>`.
 */
export function InterleavedReader({ surah, selected, recitation, onSelect }: Props) {
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
    <div className="iv-pairs">
      {surah.verses.map((verse) => {
        const isSelected = selected === verse.number;
        return (
          <div
            key={verse.number}
            className={clsx("iv-pair", isSelected && "selected")}
            data-ayah={verse.number}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={(event) => handleSelect(verse.number, event)}
            onKeyDown={(event) => handleKey(verse.number, event)}
          >
            <div className="iv-head">
              <span className="iv-num">
                {surah.number}:{verse.number}
              </span>
              {recitation ? <AyahAudio surah={surah.number} ayah={verse.number} /> : null}
            </div>
            <div className="iv-arabic" dir="rtl" lang="ar">
              {verse.arabic}
            </div>
            <div className="iv-english">{verse.english}</div>
          </div>
        );
      })}
    </div>
  );
}
