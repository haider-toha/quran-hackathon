"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";

import { LinkIcon } from "@/components/Icon";
import { toEasternArabicNumeral } from "@/lib/arabic-numerals";
import { AD_DUHA } from "@/lib/mock-data";
import type { Verse } from "@/types";

type Props = {
  /** The ayah within Ad-Duha that the active note is linked to. */
  linkedAyah: number;
};

const CONTEXT_VERSES: readonly Verse[] = AD_DUHA.verses.slice(0, 5);

// How long the brief highlight on a scrolled-to verse stays visible. Long
// enough to register as "this is the one", short enough to fade before
// reading begins.
const FLASH_MS = 800;

export function VerseContext({ linkedAyah }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for `mishkat:scroll-to-verse` events fired by the
  // AnchoredToLabel in connect mode. Find the matching row by data-ayah,
  // scroll it into view, and toggle a `flash` class for FLASH_MS so the
  // user's eye lands on the right place.
  useEffect(() => {
    function onScrollToVerse(event: Event) {
      const detail = (event as CustomEvent<{ ayah?: unknown }>).detail;
      const ayah =
        detail && typeof detail.ayah === "number" && Number.isFinite(detail.ayah)
          ? detail.ayah
          : null;
      if (ayah === null) return;
      const container = containerRef.current;
      if (!container) return;
      const row = container.querySelector<HTMLElement>(`.vc-row[data-ayah="${ayah}"]`);
      if (!row) return;
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("flash");
      window.setTimeout(() => row.classList.remove("flash"), FLASH_MS);
    }
    document.addEventListener("mishkat:scroll-to-verse", onScrollToVerse);
    return () => document.removeEventListener("mishkat:scroll-to-verse", onScrollToVerse);
  }, []);

  return (
    <div className="verse-context" ref={containerRef}>
      <div className="vc-bismillah" dir="rtl" lang="ar">
        {AD_DUHA.bismillah}
      </div>
      {CONTEXT_VERSES.map((verse) => (
        <div
          key={verse.number}
          className={clsx("vc-row", verse.number === linkedAyah && "linked")}
          data-ayah={verse.number}
        >
          {verse.number === linkedAyah ? (
            <span className="vc-anchor-icon" aria-hidden>
              <LinkIcon size={12} />
            </span>
          ) : null}
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
