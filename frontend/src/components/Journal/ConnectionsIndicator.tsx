"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  type DismissalStore,
  isDismissedIn,
  readDismissals,
  subscribeDismissals,
} from "@/lib/dismissal-store";
import { suggestionsFor } from "@/lib/mock-data";

type Props = {
  noteId: string;
  /** Switches the journal to Connect mode, surfacing the full suggestions
   * rail. The indicator is intentionally a button, not a card, so its sole
   * affordance is "show me my connections". */
  onActivate: () => void;
};

// Stable empty server snapshot for `useSyncExternalStore`. Hydration runs
// against this snapshot too, so the first client render matches the server.
// Real dismissals populate after hydration, triggering a re-render.
const SERVER_DISMISSALS: DismissalStore = Object.freeze({}) as DismissalStore;

/**
 * Bottom-right indicator: `✦ N connections`. Subtle, muted, no card chrome.
 * Hidden when there are zero live (non-dismissed) suggestions to avoid
 * a "✦ 0 connections" dead end. Clicking flips the journal to Connect
 * mode via the parent's `onActivate` callback.
 */
export function ConnectionsIndicator({ noteId, onActivate }: Props) {
  // Subscribe via the server-snapshot path so the first hydration render
  // reads the empty store (same as the server) — avoids a SSR/CSR text
  // mismatch when the user has dismissed suggestions in localStorage.
  const dismissals = useSyncExternalStore(
    subscribeDismissals,
    readDismissals,
    () => SERVER_DISMISSALS,
  );

  const liveCount = useMemo<number>(() => {
    const seed = suggestionsFor(noteId);
    return seed.filter((s) => !isDismissedIn(dismissals, noteId, s.hash)).length;
  }, [noteId, dismissals]);

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
