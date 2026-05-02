import clsx from "clsx";

import { toEasternArabicNumeral } from "@/lib/arabic-numerals";
import { AD_DUHA } from "@/lib/mock-data";
import type { Verse } from "@/types";

type Props = {
  /** The ayah within Ad-Duha that the active note is linked to. */
  linkedAyah: number;
};

const CONTEXT_VERSES: readonly Verse[] = AD_DUHA.verses.slice(0, 5);

export function VerseContext({ linkedAyah }: Props) {
  return (
    <div className="verse-context">
      <div className="vc-bismillah" dir="rtl" lang="ar">
        {AD_DUHA.bismillah}
      </div>
      {CONTEXT_VERSES.map((verse) => (
        <div key={verse.number} className={clsx("vc-row", verse.number === linkedAyah && "linked")}>
          <div className="vc-arabic" dir="rtl" lang="ar">
            {verse.arabic}{" "}
            <span
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                width: 22,
                height: 22,
                position: "relative",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="var(--color-tafsir-bg-strong)"
                  stroke="var(--color-tafsir-line)"
                  strokeWidth="0.8"
                />
              </svg>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  color: "var(--color-tafsir)",
                  fontFamily: "var(--font-arabic)",
                }}
              >
                {toEasternArabicNumeral(verse.number)}
              </span>
            </span>
          </div>
          <div className="vc-trans">{verse.english}</div>
        </div>
      ))}
    </div>
  );
}
