"use client";

// AnchoredToLabel — a small "anchored to <surah> <ayah>" element that sits
// ABOVE the note title in both compose and connect modes (Phase 3).
//
// The note's H1 title is part of the markdown body itself (see NoteBody),
// so this label has to live in the page chrome above the editor. We render
// it once per JournalV2 view, between the toolbar and the doc-wrap.
//
// Click behavior is delegated to the active mode via a custom event:
//
//   - Compose: dispatches `mishkat:open-verse-drawer`. ComposeRail listens
//     for this and toggles its drawer open.
//   - Connect: dispatches `mishkat:scroll-to-verse` with `{ ayah }`. The
//     VerseContext rows listen for this and scrollIntoView + flash.
//
// We avoid prop-drilling because both targets are already mounted as
// siblings of this label inside JournalV2's view tree, and the drawer
// state lives privately inside ComposeRail.

import { LinkIcon } from "@/components/Icon";
import { findSurahSummary } from "@/lib/mock-data";

type Props = {
  /** The full link string from the note (e.g. "93:3" or "93:6-8"). */
  link: string;
  /** Active journal mode — controls which custom event we dispatch on click. */
  mode: "compose" | "connect";
  /** First ayah parsed out of the link, used for `mishkat:scroll-to-verse`. */
  ayah: number;
};

/** Best-effort surah-name lookup. Falls back to surah number if unknown. */
function resolveSurahName(link: string): { name: string; number: number | null } {
  const match = /^(\d+):/.exec(link);
  if (!match) return { name: "Unknown", number: null };
  const num = Number(match[1]);
  const summary = findSurahSummary(num);
  return { name: summary?.transliteration ?? `Surah ${num}`, number: num };
}

/** Strip the leading `93:` from "93:3" / "93:6-8" so the suffix can be
 * shown alongside the surah name. */
function ayahSuffix(link: string): string {
  const idx = link.indexOf(":");
  return idx === -1 ? link : link.slice(idx + 1);
}

export function AnchoredToLabel({ link, mode, ayah }: Props) {
  const { name, number } = resolveSurahName(link);
  const suffix = ayahSuffix(link);
  const labelText =
    number !== null ? `Anchored to ${name} · ${number}:${suffix}` : `Anchored to ${link}`;

  function onClick() {
    if (mode === "compose") {
      document.dispatchEvent(new CustomEvent("mishkat:open-verse-drawer"));
    } else {
      // First ayah of a range is the anchor we scroll to; ranges still
      // resolve to a single row in VerseContext today.
      document.dispatchEvent(
        new CustomEvent<{ ayah: number }>("mishkat:scroll-to-verse", {
          detail: { ayah },
        }),
      );
    }
  }

  return (
    <button type="button" className="journal-v2-anchored" onClick={onClick} aria-label={labelText}>
      <LinkIcon size={11} />
      <span>{labelText}</span>
    </button>
  );
}
