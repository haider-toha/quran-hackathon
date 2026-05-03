"use client";

// Inline suggestion mirror — Phase 2 of the Journal redesign.
//
// Renders a transparent overlay above the note-body textarea that mirrors
// the editor's content with matched keywords wrapped in
// `<span class="inline-suggestion-mark">` so a thin dotted underline shows
// through. Hovering or focusing a mark opens a popover offering
// `Insert reference?` with the Insert / Dismiss buttons.
//
// Why an overlay instead of a contenteditable: the existing editor is a
// `<textarea>`, and Phase 2 explicitly forbids introducing a new editor
// library. The mirror approach is decoration-only — it never accepts text
// input, never steals focus, and never alters the source text.
//
// Layering rules:
//   - The mirror is `position: absolute; inset: 0; pointer-events: none`.
//     Most of it lets clicks pass through to the textarea so typing keeps
//     working.
//   - Each `.inline-suggestion-mark` flips `pointer-events: auto` so it can
//     receive hover. The text inside the mark is `color: transparent` —
//     only the dotted underline is visible.
//   - The textarea sits beneath the mirror with normal text colour, so the
//     user reads its text, but the underlines are drawn from the mirror.
//
// The mirror is rebuilt on every `body` change. We keep it pure (no React
// state inside the renderer) — popover open/close state lives in the
// parent so it survives re-renders triggered by typing.

import { Fragment, useMemo, type CSSProperties } from "react";

import {
  findInlineMatches,
  inlineSuggestionsFor,
  type InlineMatch,
  type InlineSuggestion,
} from "@/lib/inline-suggestions";
import type { SuggestionKind } from "@/types";

type Props = {
  noteId: string;
  body: string;
  /** Hash of the inline suggestion that should NOT render as a mark — set
   * after the user dismisses or inserts it so the underline disappears. */
  dismissedHashes: ReadonlySet<string>;
  /** Called when the user hovers/focuses a marked span. Parent positions
   * the popover relative to `anchor`. */
  onMarkActivate: (suggestion: InlineSuggestion, anchor: HTMLElement) => void;
};

/** Matches the kind tokens used by SuggestionsRail's accent palette. */
function accentTokenFor(kind: SuggestionKind): string {
  switch (kind) {
    case "tafsir-match":
      return "tafsir";
    case "related-verse":
      return "verse-link";
    case "related-note":
      return "ink-quiet";
    case "prompt":
      return "ai";
    default:
      return "ink-quiet";
  }
}

export function InlineSuggestionMirror({ noteId, body, dismissedHashes, onMarkActivate }: Props) {
  const matches = useMemo<readonly InlineMatch[]>(() => {
    const all = inlineSuggestionsFor(noteId);
    if (all.length === 0) return EMPTY;
    const live = all.filter((s) => !dismissedHashes.has(s.hash));
    if (live.length === 0) return EMPTY;
    return findInlineMatches(body, live);
  }, [noteId, body, dismissedHashes]);

  if (matches.length === 0) {
    // Still render the wrapper so the layout dimensions match the editor —
    // the textarea is sized off scrollHeight regardless.
    return <pre className="note-body-mirror" aria-hidden style={MIRROR_STYLE} />;
  }

  // Walk the body, emitting plain text segments interleaved with marked
  // spans. We keep the segmentation cheap — slice ops on a string are
  // O(n) per match and the body is tiny.
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, idx) => {
    if (match.start > cursor) {
      nodes.push(<Fragment key={`t-${idx}-${cursor}`}>{body.slice(cursor, match.start)}</Fragment>);
    }
    const text = body.slice(match.start, match.end);
    nodes.push(
      <span
        key={`m-${idx}-${match.start}`}
        className="inline-suggestion-mark"
        data-accent={accentTokenFor(match.suggestion.kind)}
        tabIndex={0}
        role="button"
        aria-label={`Suggestion: ${match.suggestion.source}. ${match.suggestion.body}`}
        onMouseEnter={(event) => onMarkActivate(match.suggestion, event.currentTarget)}
        onFocus={(event) => onMarkActivate(match.suggestion, event.currentTarget)}
      >
        {text}
      </span>,
    );
    cursor = match.end;
  });
  if (cursor < body.length) {
    nodes.push(<Fragment key={`t-tail-${cursor}`}>{body.slice(cursor)}</Fragment>);
  }

  return (
    <pre className="note-body-mirror" aria-hidden="true" style={MIRROR_STYLE}>
      {nodes}
    </pre>
  );
}

// Inline `<pre>` styling: keep wraps and whitespace identical to a
// textarea's rendering, inherit the editor's font/size/spacing, and lay
// over the editor without affecting layout. The textarea sets its own
// `min-height` based on `scrollHeight`; the mirror grows naturally with
// content via the same wrapping rules.
const MIRROR_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  margin: 0,
  padding: 0,
  border: 0,
  font: "inherit",
  color: "transparent",
  whiteSpace: "pre-wrap",
  wordWrap: "break-word",
  overflowWrap: "break-word",
  lineHeight: "inherit",
  letterSpacing: "inherit",
  background: "transparent",
  pointerEvents: "none",
};

const EMPTY: readonly InlineMatch[] = Object.freeze([]);
