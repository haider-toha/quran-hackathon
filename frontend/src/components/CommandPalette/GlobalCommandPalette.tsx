"use client";

// GlobalCommandPalette — mounts the palette overlay once at the AppShell
// root. Reads its open/closed state from the palette store via
// `useCommandPalette()` so any caller (the global ⌘K keybinding, the
// sidebar search button, future menu entries) can flip the overlay
// without prop-drilling through the layout.
//
// Also registers the global ⌘K listener via
// `useGlobalCommandPaletteHotkey()`. We register the listener inside
// this component (a single mount point) rather than scattering it across
// callers, mirroring the way `KeyboardShortcuts` owned the binding
// before Phase 6 lifted it out.

import { CommandPalette } from "./CommandPalette";
import { useCommandPalette, useGlobalCommandPaletteHotkey } from "@/hooks/useCommandPalette";

export function GlobalCommandPalette() {
  const open = useCommandPalette();
  useGlobalCommandPaletteHotkey();
  if (!open) return null;
  return <CommandPalette />;
}
