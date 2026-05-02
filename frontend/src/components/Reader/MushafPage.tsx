"use client";

import clsx from "clsx";
import { Fragment, useCallback, type MouseEvent } from "react";

import type { Surah } from "@/types";

import { VerseMarker } from "./VerseMarker";

export type AyahSelection = {
  n: number;
  rect: DOMRect;
};

type Props = {
  surah: Surah;
  selected: number | null;
  playing: number | null;
  recitation: boolean;
  onSelect: (selection: AyahSelection) => void;
  onPlay: (n: number) => void;
};

/**
 * Continuous RTL Arabic mushaf-style page. Each verse renders as three
 * sibling buttons (text, optional play marker, verse rosette) so we keep
 * native button semantics — no `<span onClick>`, no nested interactives.
 * The wrapping `.ayah-frag` `role="group"` ties the three controls
 * together for assistive tech.
 */
export function MushafPage({ surah, selected, playing, recitation, onSelect, onPlay }: Props) {
  const handleSelect = useCallback(
    (n: number, event: MouseEvent<HTMLElement>) => {
      onSelect({ n, rect: event.currentTarget.getBoundingClientRect() });
    },
    [onSelect],
  );

  return (
    <div className="mushaf-page" dir="rtl" lang="ar">
      {surah.verses.map((verse) => {
        const isSelected = selected === verse.number;
        const isPlaying = playing === verse.number;
        return (
          <Fragment key={verse.number}>
            {" "}
            <span className="ayah-frag" role="group" aria-label={`Verse ${verse.number}`}>
              <button
                type="button"
                className={clsx("ayah-run", isSelected && "selected", isPlaying && "playing")}
                onClick={(event) => handleSelect(verse.number, event)}
                data-ayah={verse.number}
                aria-pressed={isSelected}
              >
                {verse.arabic}
              </button>
              {recitation ? (
                <button
                  type="button"
                  className="play-marker"
                  onClick={() => onPlay(verse.number)}
                  aria-label={`${isPlaying ? "Pause" : "Play"} verse ${verse.number}`}
                  aria-pressed={isPlaying}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                    <path d="M2 1.5l4.5 2.5L2 6.5z" fill="currentColor" />
                  </svg>
                </button>
              ) : null}
              <VerseMarker
                n={verse.number}
                onClick={(event) => handleSelect(verse.number, event)}
              />
            </span>{" "}
          </Fragment>
        );
      })}
    </div>
  );
}
