// Help-overlay store. The `?` key (Phase 9) opens a centered modal that
// lists every keyboard shortcut grouped by area. The visibility flag lives
// in a tiny external store so the global keydown handler in
// `KeyboardShortcuts` and the `<HelpOverlay />` leaf can share state
// without prop-drilling through the AppShell.
//
// Mirrors the toast-store / context-panel-store patterns: subscribers,
// snapshot, and `useSyncExternalStore`-friendly read functions.

import { useSyncExternalStore } from "react";

let open = false;
let snapshot = open;

const listeners = new Set<() => void>();

function notify(): void {
  snapshot = open;
  for (const listener of listeners) listener();
}

export function subscribeHelpOverlay(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readHelpOverlay(): boolean {
  return snapshot;
}

// Stable server snapshot — the overlay is always closed during SSR.
export function readServerHelpOverlay(): boolean {
  return false;
}

export function openHelpOverlay(): void {
  if (open) return;
  open = true;
  notify();
}

export function closeHelpOverlay(): void {
  if (!open) return;
  open = false;
  notify();
}

export function toggleHelpOverlay(): void {
  open = !open;
  notify();
}

export function useHelpOverlayOpen(): boolean {
  return useSyncExternalStore(subscribeHelpOverlay, readHelpOverlay, readServerHelpOverlay);
}
