// Note-to-everything connection extraction. Pure functions used by the
// Phase 8 Journal map view to derive a small graph from a single note:
//   - tafsir citations parsed out of the note's prose body, and
//   - other notes that share a tag or anchor verse with the current note.
//
// Pure / React-free / synchronous. The map view re-runs both helpers on
// every render of the active note; cost stays cheap because the corpus is
// small (one surah, double-digit notes) and the regex passes are linear.

import type { Note } from "@/types";

// Known tafsir source labels that appear inside note bodies. The list is
// intentionally narrow — only sources we actually surface in the rest of
// the app belong here. New sources should be added in one place to keep
// the extraction surface predictable.
export const TAFSIR_SOURCES = ["As-Sadi", "Ibn Kathir", "Al-Qurtubi", "Al-Tabari"] as const;
export type TafsirSourceLabel = (typeof TAFSIR_SOURCES)[number];

export type TafsirCitation = {
  /** The matched source label (e.g. "As-Sadi"). */
  source: TafsirSourceLabel;
  /** Optional verse reference like "93:5" if one immediately follows the
   * label, e.g. "Tafsir Ibn Kathir, on 93:3". Captured opportunistically. */
  ref?: string;
};

// Verse-ref-shaped tags (e.g. "93:3") are emitted by the editor as
// auto-tags but are NOT semantic links between notes — they're already
// represented by the explicit `note.link`. We exclude them from the tag
// overlap test the same way Phase 3's tag rendering already does.
function isVerseRefTag(tag: string): boolean {
  return /^\d+:\d+(-\d+)?$/.test(tag);
}

/**
 * Extract distinct tafsir citations from a note body. The match is plain
 * text against the canonical labels in `TAFSIR_SOURCES`; the optional ref
 * comes from the first `\d+:\d+` token within ~24 chars after the label
 * (a tafsir line typically reads "— Tafsir Ibn Kathir, on 93:3").
 *
 * The returned list is deduped by `source` so the map view never plots two
 * "Ibn Kathir" nodes on the same canvas. The first-seen ref wins because
 * later mentions may be paraphrased context rather than the citation root.
 */
export function extractTafsirCitations(body: string): readonly TafsirCitation[] {
  if (body.length === 0) return [];
  const seen = new Map<TafsirSourceLabel, TafsirCitation>();
  for (const source of TAFSIR_SOURCES) {
    // Regex-escape: none of the source labels contain regex metacharacters
    // today, but the hyphens/spaces are safe as literals so we can splice
    // the label directly into the pattern.
    const pattern = new RegExp(
      `\\b${source}\\b(?:[\\s\\S]{0,24}?\\b(\\d+:\\d+(?:-\\d+)?)\\b)?`,
      "i",
    );
    const match = pattern.exec(body);
    if (!match) continue;
    const ref = match[1];
    const citation: TafsirCitation = ref ? { source, ref } : { source };
    seen.set(source, citation);
  }
  return Array.from(seen.values());
}

/**
 * Find notes related to `currentNote` by either:
 *   - sharing at least one non-verse-ref tag, or
 *   - pointing at the same anchor verse (`note.link` equality).
 *
 * The current note is filtered out of the result. The relation is
 * symmetric — duplicates aren't possible because we walk `allNotes` once.
 * Caller can sort/limit as it pleases; this helper preserves input order.
 */
export function findRelatedNotes(currentNote: Note, allNotes: readonly Note[]): readonly Note[] {
  const myTags = new Set(currentNote.tags.filter((t) => !isVerseRefTag(t)));
  const myLink = currentNote.link;
  const out: Note[] = [];
  for (const candidate of allNotes) {
    if (candidate.id === currentNote.id) continue;
    const sharesLink = myLink.length > 0 && candidate.link === myLink;
    const sharesTag = candidate.tags.some((t) => !isVerseRefTag(t) && myTags.has(t));
    if (sharesLink || sharesTag) out.push(candidate);
  }
  return out;
}

/** Filter a note's tags down to the visible ones (no verse-refs). The map
 * view renders these as floating outer-ring labels — same exclusion rule
 * as the Phase 3 in-note tag pills. */
export function visibleTags(note: Note): readonly string[] {
  return note.tags.filter((t) => !isVerseRefTag(t));
}
