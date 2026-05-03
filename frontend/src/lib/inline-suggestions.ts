// Per-note inline suggestion index. Drives the dotted-underline + popover
// behaviour in compose-mode `NoteBody`. When the user types one of these
// keywords (case-insensitive, whole-word, multi-word phrase aware), the
// matching span is decorated and a small popover offers `Insert reference?`.
//
// In the real implementation these would stream from the backend keyed off
// the note's draft content. For the v3 mock we hand-author the index against
// the seeded sample notes so QA can see underlines on first load. Picked
// keywords that already appear in the sample bodies (n1 GRIEF_BODY, n5
// LETTER_BODY, n9 COMPARATIVE_BODY) so the underlines render immediately.
//
// `kind` mirrors the rail's source colour map so the underline accent and
// the popover's source label can pull from the same accent token.

import type { SuggestionKind } from "@/types";

export type InlineSuggestion = {
  /** Stable id; used as React key. */
  id: string;
  /** Stable content hash; used by the dismissal store. Inline dismissals are
   *  prefixed `inline:` upstream so they don't blow away rail dismissals. */
  hash: string;
  /** The phrase to look for in the note body. Case-insensitive, whole-word.
   *  Whitespace is collapsed. Regex specials are escaped before matching. */
  keyword: string;
  /** Underline + popover source colour. */
  kind: SuggestionKind;
  /** "As-Sadi · 93:3", "Past note · n6", etc. */
  source: string;
  /** One-sentence body shown in the popover. */
  body: string;
  /** Markdown to drop into the note body when the user accepts. */
  insert: string;
};

/**
 * Hand-authored seed. Each note id maps to a small list of phrases. The
 * keywords are chosen so they actually appear in the seeded note body —
 * the underlines should render on first load without the user typing a
 * single character.
 */
export const INLINE_SUGGESTIONS: Readonly<Record<string, readonly InlineSuggestion[]>> = {
  // n1 GRIEF_BODY uses tarbiyya, ma waddaaka, qala, fatra-adjacent.
  n1: [
    {
      id: "n1-inline-tarbiyya",
      hash: "inline:n1:tarbiyya",
      keyword: "tarbiyya",
      kind: "tafsir-match",
      source: "As-Sadi · 93:3",
      body: "As-Sadi uses tarbiyya here — the same word.",
      insert:
        "## As-Sadi on tarbiyya (AI-generated)\n\n> The pause is *tarbiyya* — nurturing, not absence. The kind of stepping back a teacher does so the learner can take a step alone.\n> — As-Sadi, on 93:3\n",
    },
    {
      id: "n1-inline-waddaaka",
      hash: "inline:n1:ma-waddaaka",
      keyword: "ma waddaaka",
      kind: "tafsir-match",
      source: "Ibn Kathir · 93:3",
      body: "Ibn Kathir reads waddaaka as a formal goodbye.",
      insert:
        "## Ibn Kathir on ma waddaaka (AI-generated)\n\n> *Waddaaka* names a formal farewell. To negate it is to deny that any farewell occurred at all — not even quietly, not even unnoticed.\n> — Ibn Kathir, on 93:3\n",
    },
    {
      id: "n1-inline-qala",
      hash: "inline:n1:qala",
      keyword: "qala",
      kind: "related-note",
      source: "Past note · n6",
      body: "Your earlier note reads qala carefully.",
      insert:
        "## Past note · Reading 'qala' carefully\n\nLinks to your earlier note on the same word — heat, not distance.\n",
    },
  ],

  // n5 LETTER_BODY uses fatra, waddaaka, qala, tarda.
  n5: [
    {
      id: "n5-inline-fatra",
      hash: "inline:n5:fatra",
      keyword: "fatra",
      kind: "tafsir-match",
      source: "Al-Qurtubi · 93:1",
      body: "The fatra's duration is contested in the tafsir tradition.",
      insert:
        "## Al-Qurtubi on the fatra (AI-generated)\n\n> The classical sources do not agree. Fifteen days is the majority position; some narrate forty. The duration is contested — that may itself be the point.\n> — Al-Qurtubi, on 93:1\n",
    },
    {
      id: "n5-inline-waddaaka",
      hash: "inline:n5:waddaaka",
      keyword: "waddaaka",
      kind: "tafsir-match",
      source: "Ibn Kathir · 93:3",
      body: "Ibn Kathir reads waddaaka as a formal goodbye.",
      insert:
        "## Ibn Kathir on waddaaka (AI-generated)\n\n> *Waddaaka* names a formal farewell — the deliberate parting. Negating it denies that the parting happened at all.\n> — Ibn Kathir, on 93:3\n",
    },
    {
      id: "n5-inline-qala",
      hash: "inline:n5:qala",
      keyword: "qala",
      kind: "related-note",
      source: "Past note · n6",
      body: "Your earlier note on qala reads it as heat, not distance.",
      insert:
        "## Past note · Reading 'qala' carefully\n\nLinks to your earlier note on the same word — heat, not distance.\n",
    },
  ],

  // n9 COMPARATIVE_BODY uses la-sawfa, fa-tarda.
  n9: [
    {
      id: "n9-inline-la-sawfa",
      hash: "inline:n9:la-sawfa",
      keyword: "la-sawfa",
      kind: "tafsir-match",
      source: "As-Sadi · 93:5",
      body: "As-Sadi reads la-sawfa as the emphasised, unhurried future.",
      insert:
        "## As-Sadi on la-sawfa (AI-generated)\n\n> *La-sawfa* is emphatic, not flat. The future tense carries certainty — the gift will come, in its own time, and the open-endedness is itself part of the gift.\n> — As-Sadi, on 93:5\n",
    },
    {
      id: "n9-inline-fa-tarda",
      hash: "inline:n9:fa-tarda",
      keyword: "fa-tarda",
      kind: "tafsir-match",
      source: "Al-Qurtubi · 93:5",
      body: "Al-Qurtubi treats fa-tarda as a condition the giving must meet.",
      insert:
        "## Al-Qurtubi on fa-tarda (AI-generated)\n\n> *Fa-tarda* — *and you will be satisfied* — sets a floor for the giving. The verse does not name what will be given because the giving continues until contentment is reached.\n> — Al-Qurtubi, on 93:5\n",
    },
  ],
};

/** Stable empty list reused for misses — `useMemo` consumers can rely on
 *  reference equality across renders when a note has no inline index. */
const EMPTY: readonly InlineSuggestion[] = Object.freeze([]);

export function inlineSuggestionsFor(noteId: string): readonly InlineSuggestion[] {
  return INLINE_SUGGESTIONS[noteId] ?? EMPTY;
}

/**
 * Escape regex specials in `text`. Used so a multi-word keyword like
 * "ma waddaaka" doesn't accidentally turn into a regex pattern when we
 * embed it in a `RegExp`. Whitespace inside `text` is collapsed to a
 * single space and matched flexibly against runs of whitespace in the
 * note body via `\s+`.
 */
export function buildKeywordPattern(keyword: string): RegExp {
  const escaped = keyword
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  // Word-boundary on each side so partial-word hits don't fire (we don't
  // want "tafsir" to underline inside "tafsireen", for example). The body
  // and keyword are both case-insensitive — the `i` flag handles that.
  return new RegExp(`\\b${escaped}\\b`, "iu");
}

export type InlineMatch = {
  suggestion: InlineSuggestion;
  start: number;
  end: number;
};

/**
 * Walk the note body, returning a non-overlapping list of inline matches.
 * Each suggestion may match more than once — but earlier matches in the
 * sweep claim their span, and later matches that overlap are skipped. The
 * order is by `start` ascending, with ties broken by the suggestion's
 * declared order (so deterministic across renders).
 */
export function findInlineMatches(
  body: string,
  suggestions: readonly InlineSuggestion[],
): readonly InlineMatch[] {
  if (body.length === 0 || suggestions.length === 0) return EMPTY_MATCHES;

  type Candidate = InlineMatch & { sigOrder: number };
  const candidates: Candidate[] = [];
  suggestions.forEach((s, sigOrder) => {
    const pattern = buildKeywordPattern(s.keyword);
    const global = new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`);
    let match: RegExpExecArray | null;
    while ((match = global.exec(body)) !== null) {
      candidates.push({
        suggestion: s,
        start: match.index,
        end: match.index + match[0].length,
        sigOrder,
      });
      // Avoid zero-width infinite loops if the regex ever degrades.
      if (match.index === global.lastIndex) global.lastIndex += 1;
    }
  });

  candidates.sort((a, b) => a.start - b.start || a.sigOrder - b.sigOrder);

  // Drop overlaps: keep the first, skip any that intersect a kept range.
  const kept: InlineMatch[] = [];
  let cursor = -1;
  for (const c of candidates) {
    if (c.start < cursor) continue;
    kept.push({ suggestion: c.suggestion, start: c.start, end: c.end });
    cursor = c.end;
  }
  return kept;
}

const EMPTY_MATCHES: readonly InlineMatch[] = Object.freeze([]);
