"use client";

// useCommandPalette — subscribes to the palette's open/close store and
// returns the boolean snapshot plus stable open/close/toggle helpers. Also
// owns the global ⌘K / Ctrl+K keydown listener: we register the handler
// inside the hook (a `useEffect` keyed on registration count via
// `useGlobalCommandPaletteHotkey`) so any code path that touches the hook
// also wires the shortcut. The Topbar's old ⌘K binding has been removed
// in favour of this single source.
//
// The hotkey effect intentionally does NOT live alongside the store
// itself — the store stays a pure pub/sub module so it can be safely
// imported from non-React code (event handlers, tests). React-side
// behaviour (focus, listener registration, lifecycle) belongs in this
// hook layer instead.

import { useEffect, useSyncExternalStore } from "react";

import {
  closeCommandPalette,
  openCommandPalette,
  readCommandPalette,
  readCommandPaletteEmpty,
  subscribeCommandPalette,
  toggleCommandPalette,
} from "@/lib/command-palette-store";

export function useCommandPalette(): boolean {
  return useSyncExternalStore(subscribeCommandPalette, readCommandPalette, readCommandPaletteEmpty);
}

/**
 * Register the global ⌘K / Ctrl+K listener. Mounted exactly once at the
 * AppShell root via `<CommandPaletteHotkey />`; the keydown handler flips
 * the palette's open state regardless of where focus is, mirroring the
 * "always-on" feel users expect from ⌘K shortcuts.
 */
export function useGlobalCommandPaletteHotkey(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;
      if (event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      toggleCommandPalette();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}

export { closeCommandPalette, openCommandPalette, toggleCommandPalette };
