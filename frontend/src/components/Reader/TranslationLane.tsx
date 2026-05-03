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

export function TranslationLane({ surah, selected, recitation, onSelect }: Props) {
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
    <div className="translation-lane">
      <div className="tl-head">
        <span>Translation</span>
        <span style={{ color: "var(--color-ink-5)" }}>·</span>
        <span className="src">The Clear Quran — Mustafa Khattab</span>
      </div>
      {surah.verses.map((verse) => {
        const isSelected = selected === verse.number;
        return (
          <div
            key={verse.number}
            className={clsx("tl-ayah", isSelected && "selected")}
            data-ayah={verse.number}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={(event) => handleSelect(verse.number, event)}
            onKeyDown={(event) => handleKey(verse.number, event)}
          >
            <div className="num">{verse.number}</div>
            <div className="text">{verse.english}</div>
            {recitation ? (
              <div className="tl-audio">
                <AyahAudio surah={surah.number} ayah={verse.number} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
