// Tafsir-source enable/disable store. The SourcesChip popover (Phase 4) used
// to keep its enable state in component-local React state; Phase 10 lifts it
// out so the AskInput composer can read the active count and disable the Ask
// button when no sources are enabled. Mirrors the toast-store /
// help-overlay-store / sources-panel-store patterns: useSyncExternalStore-
// friendly subscribers, snapshot, and pure read functions.
//
// The map is keyed by `TafsirSource.id` (e.g. "sadi", "kathir"). Bool true
// means the source is enabled and may be cited by the AI; false means it is
// excluded. Missing keys fall back to `enabledByDefault` from the source
// catalog, so adding a new source ships with its own default without
// requiring a migration.

import { useSyncExternalStore } from "react";

import { TAFSIR_SOURCES } from "@/lib/mock-data";

type EnabledMap = Readonly<Record<string, boolean>>;

function buildInitial(): EnabledMap {
  const next: Record<string, boolean> = {};
  for (const source of TAFSIR_SOURCES) next[source.id] = source.enabledByDefault;
  return next;
}

// Server snapshot: a frozen, stable reference produced once at module-load.
// useSyncExternalStore demands the server snapshot be referentially stable
// across calls (otherwise React thinks the value changed every render and
// tears at hydration). We hand out the same object every time on the
// server; the client snapshot can mutate freely after hydration.
const SERVER_SNAPSHOT: EnabledMap = Object.freeze(buildInitial());

let enabled: EnabledMap = buildInitial();
let snapshot = enabled;

const listeners = new Set<() => void>();

function notify(): void {
  // Re-stamp the snapshot reference so useSyncExternalStore knows the value
  // changed. The map itself is replaced (not mutated) on every write.
  snapshot = enabled;
  for (const listener of listeners) listener();
}

export function subscribeTafsirSources(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readTafsirSources(): EnabledMap {
  return snapshot;
}

export function readServerTafsirSources(): EnabledMap {
  return SERVER_SNAPSHOT;
}

export function setTafsirSourceEnabled(id: string, value: boolean): void {
  if (enabled[id] === value) return;
  enabled = { ...enabled, [id]: value };
  notify();
}

export function toggleTafsirSource(id: string): void {
  setTafsirSourceEnabled(id, !(enabled[id] ?? false));
}

export function useTafsirSources(): EnabledMap {
  return useSyncExternalStore(subscribeTafsirSources, readTafsirSources, readServerTafsirSources);
}

export function useActiveTafsirSourceCount(): number {
  const map = useTafsirSources();
  let count = 0;
  for (const id in map) if (map[id]) count += 1;
  return count;
}
