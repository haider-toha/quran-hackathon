"use client";

import { useEffect, type RefObject } from "react";

type Options = {
  /**
   * When `false`, the listeners are not attached. Use this to gate the hook
   * on a controlled "open" flag without conditionally calling the hook
   * itself (which violates the rules of hooks).
   */
  enabled?: boolean;
};

/**
 * Fires `handler` when the user interacts (pointerdown or Escape keydown)
 * outside the element referenced by `ref`. Both listeners share a single
 * effect — combining pointer + keyboard dismissal is a common pattern for
 * popovers/dropdowns/menus, and a single effect avoids two passes of
 * register/unregister churn.
 *
 * The hook intentionally accepts a `RefObject` rather than a callback ref
 * so callers can keep using the standard `useRef<HTMLElement>(null)` shape.
 *
 * Created in Wave 2A (Ask/Research/Reader refactor) for the speaker-filter
 * dropdown in `Research.tsx`. Other agents are free to reuse it from
 * `hooks/useOnOutsideInteraction.ts`.
 */
export function useOnOutsideInteraction<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  { enabled = true }: Options = {},
): void {
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    function isInside(target: EventTarget | null): boolean {
      if (!(target instanceof Node)) return false;
      return ref.current?.contains(target) ?? false;
    }

    function onPointerDown(event: PointerEvent) {
      if (!mounted) return;
      if (isInside(event.target)) return;
      handler();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!mounted) return;
      if (event.key !== "Escape") return;
      handler();
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      mounted = false;
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, handler, enabled]);
}
