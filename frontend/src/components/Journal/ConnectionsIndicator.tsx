"use client";

import { useMemo, useSyncExternalStore } from "react";

import { isDismissed, readDismissals, subscribeDismissals } from "@/lib/dismissal-store";
import { suggestionsFor } from "@/lib/mock-data";

type Props = {
  noteId: string;
  /** Switches the journal to Connect mode, surfacing the full suggestions
   * rail. The indicator is intentionally a button, not a card, so its sole
   * affordance is "show me my connections". */
  onActivate: () => void;
};

// Stable empty server snapshot for `useSyncExternalStore`. Same pattern as
// `SuggestionsRail` — keeps SSR/hydration consistent with no live state.
const SERVER_DISMISSALS = Object.freeze({});

/**
 * Bottom-right indicator: `✦ N connections`. Subtle, muted, no card chrome.
 * Hidden when there are zero live (non-dismissed) suggestions to avoid
 * a "✦ 0 connections" dead end. Clicking flips the journal to Connect
 * mode via the parent's `onActivate` callback.
 */
export function ConnectionsIndicator({ noteId, onActivate }: Props) {
  // Re-render after dismissals so the count drops live as the user
  // dismisses suggestions in connect mode and switches back.
  useSyncExternalStore(subscribeDismissals, readDismissals, () => SERVER_DISMISSALS);

  const liveCount = useMemo<number>(() => {
    const seed = suggestionsFor(noteId);
    return seed.filter((s) => !isDismissed(noteId, s.hash)).length;
  }, [noteId]);

  if (liveCount === 0) return null;

  return (
    <button
      type="button"
      className="journal-v2-connections"
      onClick={onActivate}
      aria-label={`Show ${liveCount} ${liveCount === 1 ? "connection" : "connections"}`}
    >
      <span aria-hidden className="journal-v2-connections-mark">
        ✦
      </span>
      <span>
        {liveCount} {liveCount === 1 ? "connection" : "connections"}
      </span>
    </button>
  );
}
