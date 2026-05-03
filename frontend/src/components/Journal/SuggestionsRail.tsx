"use client";

import { useMemo, useSyncExternalStore } from "react";

import { InsertIcon, SparkleIcon, TimeIcon, XIcon } from "@/components/Icon";
import {
  dismiss,
  isDismissed,
  readDismissals,
  snooze,
  subscribeDismissals,
} from "@/lib/dismissal-store";
import { suggestionsFor } from "@/lib/mock-data";
import { usePreferences } from "@/hooks/usePreferences";
import type { Note, Suggestion, SuggestionFrequency } from "@/types";

type Props = {
  note: Note;
  /** Called when the user accepts a suggestion. Parent inserts into the note body. */
  onInsert: (content: string) => void;
};

// Spec §11: low frequency caps the rail at the top 1-2 cards. UI only —
// real implementation decides volume server-side.
const LOW_LIMIT = 2;

export function SuggestionsRail({ note, onInsert }: Props) {
  const { preferences } = usePreferences();
  const frequency: SuggestionFrequency = preferences.suggestionFrequency;

  // Subscribe to dismissal store changes so the rail re-renders after a
  // user dismisses or snoozes a card. The server snapshot is an empty
  // object — same shape, no live state, no hydration drift.
  useSyncExternalStore(subscribeDismissals, readDismissals, getServerDismissals);

  const visible = useMemo(() => {
    if (frequency === "off") return [] as readonly Suggestion[];
    const seed = suggestionsFor(note.id);
    const live = seed.filter((s) => !isDismissed(note.id, s.hash));
    if (frequency === "low") return live.slice(0, LOW_LIMIT);
    return live;
  }, [note.id, frequency]);

  // Surface gate is enforced in the parent (Journal). If we got here, the
  // surface is "rail". Keep the empty-state graceful.
  if (frequency === "off") return null;

  return (
    <div className="suggestions-rail">
      <div className="rail-head">
        <SparkleIcon size={12} />
        <span>Suggestions</span>
        <span className="count">{visible.length}</span>
      </div>
      <div className="rail-body">
        {visible.length === 0 ? (
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

function SuggestionCard({ suggestion, onInsert, onDismiss, onSnooze }: CardProps) {
  return (
    <div className="rail-card card-suggestion" data-kind={suggestion.kind}>
      <div className="reason">{suggestion.reason}</div>
      <div className="body">{suggestion.preview}</div>
      {suggestion.source ? (
        <div className="src">
          {suggestion.source.name}
          {suggestion.source.ref ? ` · ${suggestion.source.ref}` : ""}
        </div>
      ) : null}
      <div className="actions">
        <button
          type="button"
          className="btn primary sm"
          onClick={onInsert}
          aria-label={`Insert: ${suggestion.preview.slice(0, 60)}`}
        >
          <InsertIcon size={11} /> Insert
        </button>
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
      </div>
    </div>
  );
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
