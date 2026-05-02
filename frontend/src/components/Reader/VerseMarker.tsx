"use client";

import { type MouseEvent } from "react";

import { toEasternArabicNumeral } from "@/lib/arabic-numerals";

type Props = {
  n: number;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

const PETAL_COUNT = 8;
const PETAL_RADIUS = 14.5;
const CENTER = 16;

// Petal positions are constants — hoisted out of render so they are not
// recomputed (or memoized) for every VerseMarker on every render.
const PETALS: ReadonlyArray<{ cx: number; cy: number }> = Array.from(
  { length: PETAL_COUNT },
  (_, i) => {
    const angle = (i * Math.PI * 2) / PETAL_COUNT;
    return {
      cx: CENTER + Math.cos(angle) * PETAL_RADIUS,
      cy: CENTER + Math.sin(angle) * PETAL_RADIUS,
    };
  },
);

export function VerseMarker({ n, onClick }: Props) {
  return (
    <button type="button" className="verse-marker" onClick={onClick} aria-label={`Verse ${n}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle className="vm-circle" cx={CENTER} cy={CENTER} r="12.5" />
        {PETALS.map((p) => (
          <circle key={`${p.cx}-${p.cy}`} className="vm-petal" cx={p.cx} cy={p.cy} r="1.4" />
        ))}
      </svg>
      <span className="vm-num" lang="ar" dir="rtl">
        {toEasternArabicNumeral(n)}
      </span>
    </button>
  );
}
