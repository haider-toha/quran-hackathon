"use client";

// Journal chrome state — a tiny React context that lets the AppShell's
// Sidebar and Topbar collapse / hide their non-journal affordances when the
// user is in v2 Compose mode.
//
// Why a top-level provider (mounted in `AppShell`) instead of one mounted
// by the journal page itself: the Sidebar and Topbar are *siblings* of
// `{children}` inside the shell, not descendants of the journal page —
// so a provider mounted inside the journal would not be visible to them
// via React context. Hoisting the provider to the shell solves that.
//
// The provider exposes a `setChrome({ active, mode })` setter; `JournalV2`
// calls it on mount with `active: true` and on unmount with `active: false`.
// Consumers (Sidebar, Topbar) read the current value and a memoized
// `isComposeChrome` flag that's only true when the journal is mounted AND
// in compose mode AND the page is asking for the override.
//
// State here is intentionally NOT persisted: leaving the journal route
// unmounts `JournalV2`, which fires the cleanup setter, which restores the
// chrome to its default. No localStorage round-trip needed.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type JournalChromeMode = "compose" | "connect" | "map";

type ChromeState = {
  /** True while a `JournalV2` is mounted somewhere in the tree. */
  active: boolean;
  /** Which journal layout mode the page wants. Only meaningful when
   * `active` is true. */
  mode: JournalChromeMode;
};

type ChromeContextValue = ChromeState & {
  /** True when the chrome should collapse the sidebar to icons + hide
   * topbar search + show the journal mode switcher. */
  isComposeChrome: boolean;
  /** Imperative setter used by `JournalV2`'s effect to publish state up. */
  setChrome: (next: ChromeState) => void;
};

const DEFAULT_STATE: ChromeState = { active: false, mode: "connect" };

const JournalChromeContext = createContext<ChromeContextValue | null>(null);

export function JournalChromeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChromeState>(DEFAULT_STATE);

  const setChrome = useCallback((next: ChromeState) => {
    setState((prev) => {
      if (prev.active === next.active && prev.mode === next.mode) return prev;
      return next;
    });
  }, []);

  const value = useMemo<ChromeContextValue>(
    () => ({
      ...state,
      isComposeChrome: state.active && state.mode === "compose",
      setChrome,
    }),
    [state, setChrome],
  );

  return <JournalChromeContext.Provider value={value}>{children}</JournalChromeContext.Provider>;
}

/**
 * Read the chrome state. Returns the static default outside the provider —
 * code paths that read this hook outside the shell (e.g. in tests) get a
 * sane "no override" answer instead of a thrown error.
 */
export function useJournalChrome(): ChromeContextValue {
  const value = useContext(JournalChromeContext);
  if (!value) {
    return {
      ...DEFAULT_STATE,
      isComposeChrome: false,
      setChrome: () => {
        // Intentional no-op: outside the provider, callers can still
        // invoke `setChrome` without crashing during tests / storybook.
      },
    };
  }
  return value;
}

/**
 * Imperative effect helper: while the calling component is mounted, push
 * `{ active: true, mode }` into the chrome context; clean up on unmount.
 * Used by `JournalV2` so the chrome reflects whatever mode the page is in.
 *
 * Two effects, on purpose:
 *
 *   1. Push the current mode whenever it changes. No cleanup — that would
 *      momentarily reset to `active: false` between cleanup and next-run,
 *      flashing the chrome on every mode flip.
 *   2. Reset on unmount only. The cleanup of an effect with `[]` deps
 *      runs once, when the component unmounts.
 */
export function useChromeBinding(active: boolean, mode: JournalChromeMode): void {
  const { setChrome } = useJournalChrome();
  useEffect(() => {
    if (active) {
      setChrome({ active: true, mode });
    } else {
      setChrome({ active: false, mode: "connect" });
    }
  }, [active, mode, setChrome]);
  useEffect(() => {
    return () => {
      setChrome({ active: false, mode: "connect" });
    };
  }, [setChrome]);
}
