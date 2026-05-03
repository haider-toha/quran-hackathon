"use client";

// scope-context — a small client-side React context that owns the user's
// currently-active study scope (the slice of the Quran the AI is grounded
// to). The breadcrumb, ContextPanel, AskInput placeholder, ChatHistorySection
// grouping and the prompt-cards templates all read the same scope from here
// so swapping the active scope updates every surface in lock-step.
//
// In v3 the corpus is intentionally a single surah (Ad-Duha, 93). The shape
// below already models a verse range so the v4 multi-surah expansion is a
// data swap, not a refactor: callers ask for `scope.label` to render
// "Ad-Duha 93:1–11", `scope.surahNumber` to look up the verses, and
// `scope.range` to filter the rendered slice.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Scope = {
  /** Surah number (e.g. 93). */
  surahNumber: number;
  /** Display name for the surah (e.g. "Ad-Duha"). */
  surahLabel: string;
  /** Inclusive verse range. */
  range: { start: number; end: number };
  /**
   * Pre-formatted scope label, e.g. "Ad-Duha 93:1–11". Cached so callers
   * don't have to reformat it on every render.
   */
  label: string;
  /** Juz number (Quran corpus partition the surah belongs to). */
  juz: number;
  /** Display name for the juz (e.g. "Juz Amma"). */
  juzLabel: string;
};

type ScopeContextValue = {
  scope: Scope;
  setScope: (next: Scope) => void;
};

const DEFAULT_SCOPE: Scope = {
  surahNumber: 93,
  surahLabel: "Ad-Duha",
  range: { start: 1, end: 11 },
  label: "Ad-Duha 93:1–11",
  juz: 30,
  juzLabel: "Juz Amma",
};

export function makeScope(input: {
  surahNumber: number;
  surahLabel: string;
  range: { start: number; end: number };
  juz: number;
  juzLabel: string;
}): Scope {
  const { surahNumber, surahLabel, range, juz, juzLabel } = input;
  const verseLabel = range.start === range.end ? `${range.start}` : `${range.start}–${range.end}`;
  return {
    surahNumber,
    surahLabel,
    range,
    label: `${surahLabel} ${surahNumber}:${verseLabel}`,
    juz,
    juzLabel,
  };
}

const ScopeContext = createContext<ScopeContextValue | null>(null);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<Scope>(DEFAULT_SCOPE);
  const setScope = useCallback((next: Scope): void => {
    setScopeState(next);
  }, []);
  // Wrap the value in useMemo so consumers don't see a fresh reference on
  // every render of the provider — context value as object literal would
  // re-render every subscriber when the provider re-renders for any reason.
  const value = useMemo<ScopeContextValue>(() => ({ scope, setScope }), [scope, setScope]);
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope(): Scope {
  const ctx = useContext(ScopeContext);
  if (ctx === null) return DEFAULT_SCOPE;
  return ctx.scope;
}

export function useScopeSetter(): (next: Scope) => void {
  const ctx = useContext(ScopeContext);
  if (ctx === null) return () => {};
  return ctx.setScope;
}

export { DEFAULT_SCOPE };
