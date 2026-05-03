// Per-note Journal mode persistence. Pure functions over localStorage.
// Mirrors the pattern in `lib/dismissal-store.ts` and `lib/notes-store.ts`:
// in-process pub/sub plus a cached snapshot so `useSyncExternalStore`
// receives referentially-stable reads between mutations.
//
// Storage shape: a single JSON map of noteId → "compose" | "connect" | "map"
// under the key `mishkat:journal-mode:v1`. Each note's stored mode survives
// across reloads. Notes without an entry default to "compose" (Phase 1
// default). The "map" mode (Phase 8) is a read-only radial visualisation.
//
// The mutation helpers `setMode` and `clearMode` validate input through the
// `JOURNAL_MODES` allow-list before writing, so a legacy or hand-edited
// localStorage value can never poison the in-memory snapshot.

import { isPlainObject, pick } from "@/lib/validators";

const STORAGE_KEY = "mishkat:journal-mode:v1";

export const JOURNAL_MODES = ["compose", "connect", "map"] as const;
export type JournalMode = (typeof JOURNAL_MODES)[number];
export const DEFAULT_JOURNAL_MODE: JournalMode = "compose";

type Store = Readonly<Record<string, JournalMode>>;

type Listener = () => void;
const listeners = new Set<Listener>();

// Cached read-side snapshot. Same justification as `dismissal-store`:
// `useSyncExternalStore` requires the snapshot to be referentially stable
// across calls when nothing has changed; `JSON.parse` would otherwise
// produce a new object every read and trigger an infinite render loop.
let snapshot: Store | null = null;
let storageListenerInstalled = false;

function notify(): void {
  snapshot = null;
  for (const listener of listeners) listener();
}

function ensureStorageListener(): void {
  if (storageListenerInstalled) return;
  if (typeof window === "undefined") return;
  storageListenerInstalled = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    notify();
  });
}

export function subscribeJournalMode(listener: Listener): () => void {
  ensureStorageListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function validate(input: unknown): Store {
  if (!isPlainObject(input)) return Object.freeze({});
  const out: Record<string, JournalMode> = {};
  for (const [noteId, mode] of Object.entries(input)) {
    if (typeof noteId !== "string" || noteId.length === 0) continue;
    out[noteId] = pick<JournalMode>(JOURNAL_MODES, mode, DEFAULT_JOURNAL_MODE);
  }
  return Object.freeze(out);
}

function readStore(): Store {
  if (snapshot !== null) return snapshot;
  if (typeof window === "undefined") {
    snapshot = Object.freeze({});
    return snapshot;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      snapshot = Object.freeze({});
      return snapshot;
    }
    snapshot = validate(JSON.parse(raw));
    return snapshot;
  } catch {
    snapshot = Object.freeze({});
    return snapshot;
  }
}

function writeStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota / privacy mode — silently drop.
  }
}

/** Single-note read. Defaults to `"compose"` when no entry exists. */
export function readJournalMode(noteId: string): JournalMode {
  const store = readStore();
  return store[noteId] ?? DEFAULT_JOURNAL_MODE;
}

/** Stable read of the entire store. Caller-friendly when subscribing once
 * and indexing by noteId in render. */
export function readJournalModeStore(): Store {
  return readStore();
}

export function setJournalMode(noteId: string, mode: JournalMode): void {
  const store = readStore();
  if (store[noteId] === mode) return;
  const next: Record<string, JournalMode> = { ...store, [noteId]: mode };
  writeStore(Object.freeze(next));
  notify();
}

export function clearJournalMode(noteId: string): void {
  const store = readStore();
  if (!(noteId in store)) return;
  const next: Record<string, JournalMode> = { ...store };
  delete next[noteId];
  writeStore(Object.freeze(next));
  notify();
}
