// Scope-picker visibility store. The Ask `ScopeBreadcrumb` owns its own
// `SurahPicker` instance for clicks on the breadcrumb segments; Phase 9
// adds the ⌘/ shortcut and the `/scope` slash command, both of which need
// to flip the picker open from outside the breadcrumb component. Lifting
// the open flag here keeps the breadcrumb in charge of rendering and lets
// any caller request open without prop-drilling.
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

export function subscribeScopePicker(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readScopePicker(): boolean {
  return snapshot;
}

// SSR snapshot — picker is always closed on the server.
export function readServerScopePicker(): boolean {
  return false;
}

export function openScopePicker(): void {
  if (open) return;
  open = true;
  notify();
}

export function closeScopePicker(): void {
  if (!open) return;
  open = false;
  notify();
}

export function toggleScopePicker(): void {
  open = !open;
  notify();
}

export function useScopePickerOpen(): boolean {
  return useSyncExternalStore(subscribeScopePicker, readScopePicker, readServerScopePicker);
}
