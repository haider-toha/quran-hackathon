"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_JOURNAL_MODE,
  type JournalMode,
  readJournalModeStore,
  setJournalMode,
  subscribeJournalMode,
} from "@/lib/journal-mode-store";

// Stable empty store reference for the SSR snapshot. Returning the same
// frozen object each call keeps `useSyncExternalStore` from thinking the
// store mutated between server and client renders.
const SERVER_STORE: Readonly<Record<string, JournalMode>> = Object.freeze({});

type Result = {
  mode: JournalMode;
  setMode: (next: JournalMode) => void;
  toggleMode: () => void;
};

/**
 * Subscribe to the persisted journal mode for a single note id. Returns the
 * current mode plus stable setter/toggle callbacks.
 *
 * SSR returns the default mode so the server-rendered markup matches the
 * client's pre-hydration paint when no localStorage entry exists. Once
 * hydrated, the hook reads live from `lib/journal-mode-store`.
 */
export function useJournalMode(noteId: string): Result {
  const store = useSyncExternalStore(
    subscribeJournalMode,
    readJournalModeStore,
    () => SERVER_STORE,
  );

  const mode: JournalMode = store[noteId] ?? DEFAULT_JOURNAL_MODE;

  const setMode = useCallback(
    (next: JournalMode) => {
      setJournalMode(noteId, next);
    },
    [noteId],
  );

  const toggleMode = useCallback(() => {
    // Phase 8 cycle: compose → connect → map → compose. Wrap-around keeps
    // the keyboard chord and the visible mode-switch order in lock-step.
    const next: JournalMode =
      mode === "compose" ? "connect" : mode === "connect" ? "map" : "compose";
    setJournalMode(noteId, next);
  }, [noteId, mode]);

  return { mode, setMode, toggleMode };
}
