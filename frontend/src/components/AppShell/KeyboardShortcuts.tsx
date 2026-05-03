"use client";

// Global keyboard-shortcut handler. Lives as a leaf inside AppShell so the
// shell itself can stay a Server Component. Listens on `document` and
// guards every binding so plain typing never gets intercepted.
//
// Modifier-bound shortcuts (⌘1–5, ⌘/, ⌘⇧S, ⌘⇧C, ⌘,) fire from any
// focus context — the user expects them to work even while typing in the
// composer. The unmodified `?` overlay opens only when no editable element
// is focused; otherwise the keystroke falls through to the input.
//
// Phase 6 — ⌘K is no longer handled here. It moved into
// `useGlobalCommandPaletteHotkey()` (mounted by `<GlobalCommandPalette />`)
// so the shortcut and the visible overlay share a single owner. Every
// action below either pushes a route or flips a tiny global store.

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { toggleContextPanelCollapsed } from "@/lib/context-panel-store";
import { toggleHelpOverlay } from "@/lib/help-overlay-store";
import { openScopePicker } from "@/lib/scope-picker-store";
import { toggleSourcesPanel } from "@/lib/sources-panel-store";
import type { AppRoute } from "@/types";

const SHORTCUT_TARGETS: Readonly<Record<string, AppRoute>> = {
  "1": "/",
  "2": "/ask",
  "3": "/journal",
  "4": "/library",
  "5": "/research",
  ",": "/settings",
};

// `?` is shift+/ on US-layout keyboards; `event.key` reports it as "?"
// directly so we don't need to look at modifiers. We DO need to know
// whether an editable element is focused — typing `?` into a textarea
// must reach the textarea, not pop the help overlay.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const key = event.key;
      const lower = key.toLowerCase();

      if (isMeta) {
        // ⌘⇧S — toggle sources panel. Bound globally; on routes that don't
        // host the SourcesChip the toggle is a harmless no-op.
        if (isShift && lower === "s") {
          event.preventDefault();
          toggleSourcesPanel();
          return;
        }
        // ⌘⇧C — toggle context panel collapsed/expanded. Same global story.
        if (isShift && lower === "c") {
          event.preventDefault();
          toggleContextPanelCollapsed();
          return;
        }
        // ⌘/ — open the Ask scope picker. The ScopeBreadcrumb only renders
        // inside Ask, so the picker only physically appears there; on other
        // routes the store flag flips with no observable effect.
        if (key === "/") {
          event.preventDefault();
          openScopePicker();
          return;
        }
        // ⌘1–5, ⌘, — primary nav digit shortcuts. Use `event.key` (not
        // `event.code`) so the user's keyboard layout is respected.
        const target = SHORTCUT_TARGETS[key];
        if (target) {
          event.preventDefault();
          router.push(target);
          return;
        }
        return;
      }

      // Unmodified `?` opens the help overlay, but only when the user
      // isn't typing into an editable element. Repeats are dropped so a
      // held key doesn't toggle on every fire.
      if (key === "?" && !event.repeat && !isEditableTarget(event.target)) {
        event.preventDefault();
        toggleHelpOverlay();
        return;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
