// Suggestion dismissal storage. Pure functions over localStorage. No React.
//
// Shape: per-note map of content-hash → { dismissed, snoozedUntil }.
// "dismissed" is permanent until the user un-dismisses (out of scope for v3
// mock). "snoozedUntil" is a unix-ms cutoff after which the suggestion
// reappears. Snooze is checked against `Date.now()` on every read.

const STORAGE_KEY = "mishkat:dismissals:v1";
const DEFAULT_SNOOZE_MS = 24 * 60 * 60 * 1000; // 24h

export type DismissalRecord = { dismissed: boolean; snoozedUntil: number | null };
export type DismissalStore = Record<string /*noteId*/, Record<string /*hash*/, DismissalRecord>>;

// In-process pub/sub so React consumers can re-render after a `dismiss` /
// `snooze`. The store is otherwise stateless from React's view.
type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeDismissals(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDismissalRecord(value: unknown): value is DismissalRecord {
  if (!isPlainObject(value)) return false;
  const dismissed = value.dismissed;
  const snoozedUntil = value.snoozedUntil;
  return (
    typeof dismissed === "boolean" &&
    (snoozedUntil === null || (typeof snoozedUntil === "number" && Number.isFinite(snoozedUntil)))
  );
}

function validate(input: unknown): DismissalStore {
  if (!isPlainObject(input)) return {};
  const out: DismissalStore = {};
  for (const [noteId, perNote] of Object.entries(input)) {
    if (!isPlainObject(perNote)) continue;
    const inner: Record<string, DismissalRecord> = {};
    for (const [hash, record] of Object.entries(perNote)) {
      if (isDismissalRecord(record)) inner[hash] = record;
    }
    if (Object.keys(inner).length > 0) out[noteId] = inner;
  }
  return out;
}

export function readDismissals(): DismissalStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return validate(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeDismissals(store: DismissalStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota / privacy mode — silently drop.
  }
}

export function isDismissed(noteId: string, hash: string): boolean {
  const store = readDismissals();
  const record = store[noteId]?.[hash];
  if (!record) return false;
  if (record.dismissed) return true;
  if (record.snoozedUntil !== null && record.snoozedUntil > Date.now()) return true;
  return false;
}

export function dismiss(noteId: string, hash: string): void {
  const store = readDismissals();
  const perNote = store[noteId] ?? {};
  perNote[hash] = { dismissed: true, snoozedUntil: null };
  store[noteId] = perNote;
  writeDismissals(store);
  notify();
}

export function snooze(noteId: string, hash: string, durationMs: number = DEFAULT_SNOOZE_MS): void {
  const store = readDismissals();
  const perNote = store[noteId] ?? {};
  perNote[hash] = { dismissed: false, snoozedUntil: Date.now() + durationMs };
  store[noteId] = perNote;
  writeDismissals(store);
  notify();
}
