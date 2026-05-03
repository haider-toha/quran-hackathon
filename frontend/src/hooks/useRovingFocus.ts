"use client";

// useRovingFocus — keyboard-driven active-index tracking for ARIA listboxes,
// menus, command palettes, and other linear-list pickers.
//
// The hook holds an `activeIndex` and exposes both an event handler and the
// raw setter. It cycles within `[0, count)`, supports ArrowUp / ArrowDown /
// Home / End out of the box, and resets to `0` whenever the underlying item
// list (its length, by default) changes — typical when a search filter
// updates the matched set.
//
// This is intentionally `any`-free, list-shape-agnostic: the consumer is
// expected to pass a stable count + a value to watch (typically a query
// string) so we know when to reset selection. Selection / "open" semantics
// stay with the consumer; this hook is purely about which row is hot.

import { useCallback, useState } from "react";

export type RovingFocusOptions = {
  /** When `false`, `onKeyDown` is a no-op so the consumer's keydown handler short-circuits. */
  enabled?: boolean;
  /**
   * When `true`, ArrowDown past the last item wraps to the first (and vice
   * versa). Default `false` (clamps at the edges) which matches our existing
   * SlashMenu / TemplatePicker behaviour.
   */
  wrap?: boolean;
};

export type RovingFocusResult = {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  /**
   * Attach to the element receiving keyboard input. Handles ArrowUp /
   * ArrowDown / Home / End and `event.preventDefault()`s when it claims a
   * key. Returns `false` when no action was taken so a parent handler can
   * decide what to do next (e.g. submit on Enter).
   */
  onKeyDown: (event: KeyboardEvent | React.KeyboardEvent) => boolean;
};

export function useRovingFocus(
  count: number,
  resetKey: unknown,
  options: RovingFocusOptions = {},
): RovingFocusResult {
  const { enabled = true, wrap = false } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  // Track the previous reset key so we can clamp during render — same React
  // 19 "derive state during render" pattern used elsewhere in this app.
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setActiveIndex(0);
  }
  // If the count shrinks below `activeIndex` (e.g. filter narrowed), pull
  // the index back into range. Clamp during render rather than in an effect
  // to avoid the extra paint with a stale row highlighted.
  if (count > 0 && activeIndex >= count) {
    setActiveIndex(count - 1);
  }
  if (count === 0 && activeIndex !== 0) {
    setActiveIndex(0);
  }

  const onKeyDown = useCallback(
    (event: KeyboardEvent | React.KeyboardEvent): boolean => {
      if (!enabled || count === 0) return false;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => {
          const next = i + 1;
          if (next >= count) return wrap ? 0 : count - 1;
          return next;
        });
        return true;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => {
          const next = i - 1;
          if (next < 0) return wrap ? count - 1 : 0;
          return next;
        });
        return true;
      }
      if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
        return true;
      }
      if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(count - 1);
        return true;
      }
      return false;
    },
    [enabled, count, wrap],
  );

  // Reset to the top when disabled. Derive during render rather than via an
  // effect so the next mount/open starts at index 0 without burning an
  // extra paint.
  const [lastEnabled, setLastEnabled] = useState(enabled);
  if (lastEnabled !== enabled) {
    setLastEnabled(enabled);
    if (!enabled && activeIndex !== 0) {
      setActiveIndex(0);
    }
  }

  return { activeIndex, setActiveIndex, onKeyDown };
}
