"use client";

// ComposeRail — the narrow left sidebar shown in v2 Compose mode. Replaces
// the heavy 38%-wide verse pane from v1 with a glanceable 80px column that
// shows the anchored verse number and a short Arabic snippet. Clicking the
// rail expands a temporary drawer overlaying the page (does not push
// layout). The drawer dismisses on Escape, on outside click, or on the
// rail's own click toggle.

import clsx from "clsx";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { toEasternArabicNumeral } from "@/lib/arabic-numerals";
import { AD_DUHA } from "@/lib/mock-data";
import { useOnOutsideInteraction } from "@/hooks/useOnOutsideInteraction";
import type { Verse } from "@/types";

import { VerseContext } from "./VerseContext";

type Props = {
  /** Ayah number the active note is anchored to. `0` when no link is set —
   * the rail still renders so layout stays stable, but the badge falls back
   * to a placeholder dash. */
  linkedAyah: number;
};

// Cap the Arabic preview so the rail never overflows its 80-px column.
// First few words are enough for visual recognition.
const PREVIEW_WORD_COUNT = 4;

function findVerse(ayah: number): Verse | null {
  if (ayah <= 0) return null;
  return AD_DUHA.verses.find((v) => v.number === ayah) ?? null;
}

function previewArabic(verse: Verse | null): string {
  if (!verse) return "—";
  const words = verse.arabic.trim().split(/\s+/u);
  if (words.length <= PREVIEW_WORD_COUNT) return verse.arabic;
  return `${words.slice(0, PREVIEW_WORD_COUNT).join(" ")}…`;
}

export function ComposeRail({ linkedAyah }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const drawerContainerRef = useRef<HTMLDivElement>(null);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  // Outside-click + Escape close the drawer. The hook is gated on
  // `drawerOpen` so the global listeners only run while the drawer is
  // visible; the rail's own click handler then re-opens it. Without the
  // gate, the same pointerdown that opens the drawer would also be seen
  // as "outside the still-not-yet-mounted drawer", instantly closing it.
  useOnOutsideInteraction(drawerContainerRef, closeDrawer, { enabled: drawerOpen });

  // The "Anchored to ..." label rendered above the editor (Phase 3) needs
  // to open this same drawer without prop-drilling through ComposeView.
  // It dispatches `mishkat:open-verse-drawer` on click; we listen here.
  useEffect(() => {
    function onOpen() {
      openDrawer();
    }
    document.addEventListener("mishkat:open-verse-drawer", onOpen);
    return () => document.removeEventListener("mishkat:open-verse-drawer", onOpen);
  }, [openDrawer]);

  const verse = findVerse(linkedAyah);
  const numeral = linkedAyah > 0 ? toEasternArabicNumeral(linkedAyah) : "·";
  const arabicPreview = previewArabic(verse);

  return (
    <>
      <button
        type="button"
        className={clsx("journal-v2-rail", drawerOpen && "is-open")}
        onClick={toggleDrawer}
        aria-expanded={drawerOpen}
        aria-controls={drawerId}
        aria-label={
          linkedAyah > 0
            ? `Anchored to ayah ${linkedAyah}. Tap to see verse context.`
            : "No verse anchor. Tap to see verse context."
        }
      >
        <span className="journal-v2-rail-badge" aria-hidden>
          <span className="journal-v2-rail-badge-num">{numeral}</span>
        </span>
        <span className="journal-v2-rail-preview" dir="rtl" lang="ar" aria-hidden>
          {arabicPreview}
        </span>
      </button>

      {/* The drawer mounts only when open so transitions/overlays don't
          intercept pointer events while collapsed. We render the same
          VerseContext component the v1 layout uses, so the drawer's
          contents stay in sync with the canonical verse-pane treatment. */}
      {drawerOpen ? (
        <div
          className="journal-v2-drawer-scrim"
          aria-hidden
          // Decorative scrim — the wrapping <div> below carries the
          // role="dialog". Click on the scrim is also caught by
          // `useOnOutsideInteraction`, so this is purely visual.
        >
          <div
            ref={drawerContainerRef}
            id={drawerId}
            className="journal-v2-drawer"
            role="dialog"
            aria-modal="false"
            aria-label="Anchored verse context"
          >
            <div className="pane-head">
              <span className="pane-title">Ad-Duha · 93</span>
              <span className="pane-spacer" />
              <span className="journal-v2-drawer-meta">linked to note</span>
            </div>
            <VerseContext linkedAyah={linkedAyah} />
          </div>
        </div>
      ) : null}
    </>
  );
}
