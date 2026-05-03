"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { InsertIcon, SparkleIcon, TimeIcon, XIcon } from "@/components/Icon";
import {
  dismiss,
  isDismissedIn,
  readDismissals,
  snooze,
  subscribeDismissals,
} from "@/lib/dismissal-store";
import { suggestionsFor } from "@/lib/mock-data";
import { usePreferences } from "@/hooks/usePreferences";
import type { Note, Suggestion, SuggestionFrequency, SuggestionKind } from "@/types";

type Props = {
  note: Note;
  /** Called when the user accepts a suggestion. Parent inserts into the note body. */
  onInsert: (content: string) => void;
};

// Spec §11: low frequency caps the rail at the top 1-2 cards. UI only —
// real implementation decides volume server-side.
const LOW_LIMIT = 2;

// reviewOnSave: how long the user must be idle (no keystrokes in NoteBody)
// before the rail body reveals. 30 seconds — the spec value.
const IDLE_REVEAL_MS = 30_000;

export function SuggestionsRail({ note, onInsert }: Props) {
  const { preferences } = usePreferences();
  const frequency: SuggestionFrequency = preferences.suggestionFrequency;
  const reviewOnSave = preferences.reviewOnSave;

  // Subscribe to dismissal store changes so the rail re-renders after a
  // user dismisses or snoozes a card. The first hydration render reads the
  // empty `getServerDismissals` snapshot so the SSR and CSR DOM agree —
  // real dismissals populate post-hydration.
  const dismissals = useSyncExternalStore(
    subscribeDismissals,
    readDismissals,
    getServerDismissals,
  );

  const visible = useMemo<readonly Suggestion[]>(() => {
    if (frequency === "off") return [];
    const seed = suggestionsFor(note.id);
    const live = seed.filter((s) => !isDismissedIn(dismissals, note.id, s.hash));
    if (frequency === "low") return live.slice(0, LOW_LIMIT);
    return live;
  }, [note.id, frequency, dismissals]);

  // reviewOnSave gate — when on, the body is suppressed until the user
  // pauses or saves. The header count still reflects the real number.
  // We start with `revealed = !reviewOnSave`; when reviewOnSave flips on,
  // we re-suppress until the next idle/save event.
  const revealed = useReviewOnSaveReveal({ enabled: reviewOnSave, noteId: note.id });

  // Surface gate is enforced in the parent (Journal). If we got here, the
  // surface is "rail". Keep the empty-state graceful.
  if (frequency === "off") return null;

  const showCards = !reviewOnSave || revealed;

  return (
    <div className="suggestions-rail">
      <div className="rail-head">
        <SparkleIcon size={12} />
        <span>Suggestions</span>
        <span className="count">{visible.length}</span>
      </div>
      <div className="rail-body">
        {showCards ? (
          visible.length === 0 ? (
            <div className="rail-empty">All caught up. New suggestions surface as you write.</div>
          ) : (
            visible.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onInsert={() => {
                  onInsert(formatSuggestionForInsert(suggestion));
                  // Dismiss after insert so the card disappears.
                  dismiss(note.id, suggestion.hash);
                }}
                onDismiss={() => dismiss(note.id, suggestion.hash)}
                onSnooze={() => snooze(note.id, suggestion.hash)}
              />
            ))
          )
        ) : (
          <div className="rail-empty">All quiet — suggestions appear when you pause or save.</div>
        )}
        <div className="rail-foot">Suggestions update as you write.</div>
      </div>
    </div>
  );
}

type CardProps = {
  suggestion: Suggestion;
  onInsert: () => void;
  onDismiss: () => void;
  onSnooze: () => void;
};

/**
 * The redesigned (Phase 2) card. Source-only header, two-line preview,
 * Insert as the primary action. Snooze + Dismiss icons are hidden until
 * hover/focus-within. No background fill — just a thin left accent line
 * coloured by source.
 */
function SuggestionCard({ suggestion, onInsert, onDismiss, onSnooze }: CardProps) {
  return (
    <div
      className="rail-card card-suggestion"
      data-kind={suggestion.kind}
      data-accent={accentTokenFor(suggestion.kind)}
    >
      <div className="src">{sourceLabel(suggestion)}</div>
      <div className="body">{suggestion.preview}</div>
      <div className="actions">
        <button
          type="button"
          className="btn primary sm"
          onClick={onInsert}
          aria-label={`Insert: ${suggestion.preview.slice(0, 60)}`}
        >
          <InsertIcon size={11} /> Insert
        </button>
        <span className="actions-hover">
          <button
            type="button"
            className="btn ghost sm"
            onClick={onSnooze}
            aria-label="Snooze for 24 hours"
            title="Snooze for 24 hours"
          >
            <TimeIcon size={11} />
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={onDismiss}
            aria-label="Dismiss suggestion"
            title="Dismiss"
          >
            <XIcon size={11} />
          </button>
        </span>
      </div>
    </div>
  );
}

/**
 * Compose the small mono source line shown at the top of each card.
 * Examples: `As-Sadi · 93:3`, `Past note · n6`, `Prompt`.
 */
function sourceLabel(suggestion: Suggestion): string {
  if (suggestion.kind === "prompt") return "Prompt";
  if (!suggestion.source) return "Source";
  if (suggestion.source.ref) {
    return `${suggestion.source.name} · ${suggestion.source.ref}`;
  }
  return suggestion.source.name;
}

/**
 * Map a suggestion kind to a `data-accent` token the CSS reads to pick the
 * left-line colour. Kept as a typed lookup so adding a new kind forces a
 * compile-time decision about its accent.
 */
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

/**
 * Reveal-gating hook for the "Review suggestions only when you pause or
 * save" preference. When `enabled === false`, always returns `true` (the
 * rail body shows immediately). When `enabled === true`, returns `false`
 * until either:
 *
 *   - the user has been idle (no `mishkat:note-typing` event) for >30s, or
 *   - a `mishkat:note-saved` event fires for any note, OR
 *   - the active note id changes (so opening a fresh note doesn't inherit
 *     a suppressed state from the prior one).
 *
 * Implementation note: we keep two pieces of state — `gateKey` (a string
 * derived from `{enabled, noteId}`) and `revealed`. The reset when those
 * inputs change is handled by `useState`'s initializer at the top of the
 * effect-key change rather than by a `setState` inside the effect body,
 * which the `react-hooks/set-state-in-effect` lint rule rightly flags.
 */
function useReviewOnSaveReveal({ enabled, noteId }: { enabled: boolean; noteId: string }): boolean {
  // The "current intent" key. When inputs change, the render-time
  // comparison below resets `revealed` to its starting value — no
  // setState inside an effect is needed. This is the React 19 pattern
  // for derived-state-on-prop-change.
  const gateKey = `${enabled ? "1" : "0"}:${noteId}`;
  const [snapshot, setSnapshot] = useState<{ key: string; revealed: boolean }>(() => ({
    key: gateKey,
    revealed: !enabled,
  }));

  let revealed = snapshot.revealed;
  if (snapshot.key !== gateKey) {
    // Inputs changed since last render — recompute and store, but do
    // it during render via setState (React allows this for "reset on
    // prop change" without effect cascading).
    revealed = !enabled;
    setSnapshot({ key: gateKey, revealed });
  }

  useEffect(() => {
    if (!enabled) return;

    let idleTimer: number | null = null;
    function scheduleIdle() {
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        setSnapshot({ key: gateKey, revealed: true });
      }, IDLE_REVEAL_MS);
    }

    function onTyping() {
      // Active typing — suppress the body and re-arm the idle timer.
      setSnapshot({ key: gateKey, revealed: false });
      scheduleIdle();
    }

    function onSaved() {
      setSnapshot({ key: gateKey, revealed: true });
    }

    // Arm the initial idle window so an opened note that the user
    // doesn't touch will reveal after IDLE_REVEAL_MS even without a save.
    scheduleIdle();

    window.addEventListener("mishkat:note-typing", onTyping);
    window.addEventListener("mishkat:note-saved", onSaved);
    return () => {
      window.removeEventListener("mishkat:note-typing", onTyping);
      window.removeEventListener("mishkat:note-saved", onSaved);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
    };
  }, [enabled, gateKey]);

  return revealed;
}

/**
 * Compose the markdown a suggestion should drop into the note body when the
 * user accepts it. Format mirrors how slash commands render their results:
 * an AI-generated label, body, and source attribution.
 */
function formatSuggestionForInsert(suggestion: Suggestion): string {
  const aiTag = "(AI-generated)";
  switch (suggestion.kind) {
    case "related-verse": {
      const ref = suggestion.source?.ref ?? "";
      const heading = ref ? `## Related verse · ${ref}` : "## Related verse";
      return `${heading}\n\n${suggestion.preview}\n`;
    }
    case "tafsir-match": {
      const src = suggestion.source ? ` · ${suggestion.source.name}` : "";
      return `## Tafsir match${src} ${aiTag}\n\n> ${suggestion.preview}\n${
        suggestion.source ? `> — ${suggestion.source.name}, ${suggestion.source.ref}` : ""
      }`;
    }
    case "related-note":
      return `## Related note ${aiTag}\n\n${suggestion.preview}\n`;
    case "prompt":
      return `## Reflection prompt ${aiTag}\n\n*${suggestion.preview}*\n`;
    default:
      return suggestion.preview;
  }
}

// Stable empty server snapshot for useSyncExternalStore. Returning the same
// reference each call means React won't think the snapshot is mutating
// between renders during SSR.
const SERVER_DISMISSALS = Object.freeze({});
function getServerDismissals(): typeof SERVER_DISMISSALS {
  return SERVER_DISMISSALS;
}
