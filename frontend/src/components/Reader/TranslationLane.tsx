"use client";

import clsx from "clsx";
import { useCallback, type MouseEvent } from "react";

import type { Surah } from "@/types";

import type { AyahSelection } from "./MushafPage";

type Props = {
  surah: Surah;
  selected: number | null;
  onSelect: (selection: AyahSelection) => void;
};

export function TranslationLane({ surah, selected, onSelect }: Props) {
  const handleSelect = useCallback(
    (n: number, event: MouseEvent<HTMLButtonElement>) => {
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
          <button
            key={verse.number}
            type="button"
            className={clsx("tl-ayah", isSelected && "selected")}
            onClick={(event) => handleSelect(verse.number, event)}
          >
            <div className="num">{verse.number}</div>
            <div className="text">{verse.english}</div>
          </button>
        );
      })}
    </div>
  );
}
