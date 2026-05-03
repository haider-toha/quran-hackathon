// Context-panel store. Mirrors toast-store / chat-store: a tiny external
// store consumed via `useSyncExternalStore`, so any component on the Ask
// shell can read and mutate the panel mode + active citation without
// threading callbacks through five levels of props.
//
// The Ask `ContextPanel` defaults to "verse" mode (showing the scoped
// surah verses). Clicking a citation anchor flips the panel into
// "citation" mode and stores the active citation so the panel can render
// the cited tafsir passage. The mode toggle in the panel header lets the
// user manually swap back.
//
// Phase 9 lifts the panel's collapsed/expanded flag here too so the
// global ⌘⇧C shortcut can flip visibility from anywhere on the page —
// the Ask shell still owns the initial breakpoint check (collapsed at
// < 1280px) and seeds the store with that result on mount.

import { useSyncExternalStore } from "react";

import type { AnswerCitation } from "@/types";

export type ContextPanelMode = "verse" | "citation";

export type ContextPanelState = {
  mode: ContextPanelMode;
  activeCitation: AnswerCitation | null;
  collapsed: boolean;
};

const INITIAL_STATE: ContextPanelState = {
  mode: "verse",
  activeCitation: null,
  collapsed: false,
};

let state: ContextPanelState = INITIAL_STATE;
let snapshot: ContextPanelState = state;

const listeners = new Set<() => void>();

function notify(): void {
  snapshot = state;
  for (const listener of listeners) listener();
}

export function subscribeContextPanel(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readContextPanel(): ContextPanelState {
  return snapshot;
}

// Stable empty snapshot for SSR — `useSyncExternalStore` requires a
// referentially-stable server snapshot to avoid hydration churn.
const SERVER_SNAPSHOT: ContextPanelState = INITIAL_STATE;
export function readServerContextPanel(): ContextPanelState {
  return SERVER_SNAPSHOT;
}

export function setContextPanelMode(mode: ContextPanelMode): void {
  if (state.mode === mode) return;
  state = { ...state, mode };
  notify();
}

export function setActiveCitation(citation: AnswerCitation | null): void {
  // Picking a citation always flips the panel into citation mode so the
  // user sees the cited passage without an extra click. Picking a citation
  // also forces the panel open — otherwise the user would click an anchor
  // in a collapsed panel and see nothing happen.
  state = {
    mode: citation === null ? state.mode : "citation",
    activeCitation: citation,
    collapsed: citation === null ? state.collapsed : false,
  };
  notify();
}

export function clearActiveCitation(): void {
  state = { ...state, activeCitation: null };
  notify();
}

/**
 * Set the panel's collapsed flag directly. Used once at mount by the Ask
 * shell to apply the breakpoint default (collapsed at < 1280px).
 */
export function setContextPanelCollapsed(collapsed: boolean): void {
  if (state.collapsed === collapsed) return;
  state = { ...state, collapsed };
  notify();
}

/**
 * Flip the panel between collapsed and expanded. Used by both the
 * in-header chevron and the ⌘⇧C global shortcut.
 */
export function toggleContextPanelCollapsed(): void {
  state = { ...state, collapsed: !state.collapsed };
  notify();
}

export function useContextPanelState(): ContextPanelState {
  return useSyncExternalStore(subscribeContextPanel, readContextPanel, readServerContextPanel);
}
