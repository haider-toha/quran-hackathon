// Sources-panel visibility store. The `SourcesChip` popover (Phase 4)
// previously held its own open/close state; Phase 9 lifts that flag here so
// keyboard shortcuts (⌘⇧S, slash `/sources`) and the chip itself share a
// single source of truth without forcing the chip to expose imperative
// open/close handles up to the Ask shell.
//
// Mirrors the toast-store / help-overlay-store patterns: subscribers,
// snapshot, and `useSyncExternalStore`-friendly read functions.

import { useSyncExternalStore } from "react";

let open = false;
let snapshot = open;

const listeners = new Set<() => void>();

function notify(): void {
  snapshot = open;
  for (const listener of listeners) listener();
}

export function subscribeSourcesPanel(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readSourcesPanel(): boolean {
  return snapshot;
}

// Stable SSR snapshot — popover is always closed on the server.
export function readServerSourcesPanel(): boolean {
  return false;
}

export function openSourcesPanel(): void {
  if (open) return;
  open = true;
  notify();
}

export function closeSourcesPanel(): void {
  if (!open) return;
  open = false;
  notify();
}

export function toggleSourcesPanel(): void {
  open = !open;
  notify();
}

export function useSourcesPanelOpen(): boolean {
  return useSyncExternalStore(subscribeSourcesPanel, readSourcesPanel, readServerSourcesPanel);
}
