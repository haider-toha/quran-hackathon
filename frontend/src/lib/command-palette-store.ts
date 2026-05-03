// Command-palette open/close store. A two-state external store (open or
// closed) that the global ⌘K listener and any caller (sidebar search button,
// future menu entries) can share. Mirrors the pub/sub pattern used in
// `notes-store` and `dismissal-store`: `subscribe()` for React's
// `useSyncExternalStore`, `read()` for snapshots, plus imperative
// `open()` / `close()` / `toggle()` mutators.
//
// We deliberately keep this OUTSIDE React context. The palette mounts at
// the AppShell root so callers anywhere in the tree can open it without
// threading a prop through nested components, and a tiny module-scope
// store avoids the re-render storm a context-based open flag would cause
// on routes that don't care about the palette state.
//
// SSR returns `false` from `readEmpty()`. The palette is purely a client
// affordance, so server-render emits no markup.
//
// Listener is intentionally synchronous — ⌘K should feel instant — and the
// snapshot is a primitive (`boolean`), so referential stability is free.
"use client";

type Listener = () => void;
const listeners = new Set<Listener>();

let isOpen = false;

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeCommandPalette(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readCommandPalette(): boolean {
  return isOpen;
}

export function readCommandPaletteEmpty(): boolean {
  return false;
}

export function openCommandPalette(): void {
  if (isOpen) return;
  isOpen = true;
  notify();
}

export function closeCommandPalette(): void {
  if (!isOpen) return;
  isOpen = false;
  notify();
}

export function toggleCommandPalette(): void {
  isOpen = !isOpen;
  notify();
}
