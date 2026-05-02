"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type Options = {
  /** Called when the user presses Escape inside the dialog. */
  onEscape?: () => void;
  /** When `true`, restore focus to whatever was focused before the dialog opened. Defaults to `true`. */
  restoreFocus?: boolean;
};

/**
 * Minimal accessible-dialog focus management:
 *
 * - Records `document.activeElement` on mount and restores focus to it on
 *   unmount (so the trigger button regains focus when a popover closes).
 * - Captures Tab / Shift+Tab inside the container ref and cycles focus to
 *   keep the user inside the dialog (a "soft" focus trap — sufficient for
 *   small popovers like our command palette and surah picker without
 *   pulling in `inert` or a third-party trap).
 * - Optionally wires Escape to `onEscape`.
 *
 * The hook is intentionally not a full focus trap (no MutationObserver to
 * react to dynamic focusables, no aria-hiding of the rest of the page).
 * Upgrade to `react-aria` or `focus-trap-react` when the dialog model
 * grows beyond these lightweight popovers.
 */
export function useDialogFocus<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { onEscape, restoreFocus = true }: Options = {},
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      previousFocusRef.current = active instanceof HTMLElement ? active : null;
    }

    return () => {
      if (!restoreFocus) return;
      const previous = previousFocusRef.current;
      if (previous && document.body.contains(previous)) previous.focus();
    };
  }, [restoreFocus]);

  useEffect(() => {
    function focusables(): HTMLElement[] {
      const root = ref.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0]!;
      const last = els[els.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [ref, onEscape]);
}
