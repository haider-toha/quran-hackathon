"use client";

// TranslationWatermark — Phase 3, compose-mode only. As the user scrolls
// the writing pane past ~200px, the anchored verse's English translation
// fades in as a watermark in the right margin at ~8% opacity.
//
// Mounted as a SIBLING of the scroll container (`.journal-v2-doc-wrap`)
// inside `.journal-v2-pane`, then absolutely positioned to the pane's
// top-right corner via CSS. This keeps the watermark glued to the pane
// edge as the user scrolls — sticky-inside-scroller would clip when the
// scroll container's overflow is set to auto.
//
// Rendering rules:
//   - pointer-events: none + aria-hidden — purely decorative.
//   - Opacity transitions over ~400ms; fade is purely class-driven.
//
// Compose-only by composition: JournalV2's ConnectView never renders
// this component, so connect mode (which has the full verse pane) sees
// nothing extra.

import { useEffect, useRef, useState } from "react";

import { AD_DUHA } from "@/lib/mock-data";
import type { Verse } from "@/types";

type Props = {
  /** The ayah number this note is anchored to. The watermark text is the
   * English translation for that verse — when 0 / not found, the
   * watermark renders empty so we don't show garbage. */
  linkedAyah: number;
};

const SCROLL_THRESHOLD_PX = 200;

function findVerse(ayah: number): Verse | null {
  if (ayah <= 0) return null;
  return AD_DUHA.verses.find((v) => v.number === ayah) ?? null;
}

export function TranslationWatermark({ linkedAyah }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const verse = findVerse(linkedAyah);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Locate the doc-wrap scroll container — it's our previous sibling
    // chain, but querying within the pane is more robust than walking
    // siblings (DOM order isn't a stable contract). The pane is the
    // closest positioned ancestor.
    const pane = el.closest(".journal-v2-pane") as HTMLElement | null;
    const scroller = pane?.querySelector(".journal-v2-doc-wrap") as HTMLElement | null;
    if (!scroller) return;

    function onScroll() {
      if (!scroller) return;
      setVisible(scroller.scrollTop > SCROLL_THRESHOLD_PX);
    }

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <aside
      ref={ref}
      className={"journal-v2-watermark" + (visible ? " is-visible" : "")}
      aria-hidden
    >
      {verse?.english ?? ""}
    </aside>
  );
}
