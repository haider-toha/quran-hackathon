// Notifications store. SessionStorage-backed so the inbox is reset between
// sessions in v3 — a real backend will arrive later. Pure functions; the
// caller is responsible for re-rendering after each mutation (we surface a
// subscribe() so a topbar bell can listen without prop drilling).
//
// Shape: `{ seeded: boolean; entries: Notification[] }`. `seeded` lets us seed
// two sample notifications on first read without trampling an empty inbox the
// user has explicitly cleared.

const STORAGE_KEY = "mishkat:notifications:v1";

export type NotificationKind = "deep-research-completed" | "info";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  createdAt: number;
  read: boolean;
};

type Stored = {
  seeded: boolean;
  entries: Notification[];
};

type Listener = () => void;
const listeners = new Set<Listener>();

// Cached read-side snapshot. `useSyncExternalStore` requires a referentially
// stable snapshot across calls when nothing has changed. We rebuild it only
// after a mutation OR on first read.
let snapshot: readonly Notification[] | null = null;

function notify(): void {
  // Bust the cached snapshot so the next read pulls fresh state.
  snapshot = null;
  for (const listener of listeners) listener();
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNotification(value: unknown): value is Notification {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.id === "string" &&
    (value.kind === "deep-research-completed" || value.kind === "info") &&
    typeof value.title === "string" &&
    typeof value.body === "string" &&
    (value.href === null || typeof value.href === "string") &&
    typeof value.createdAt === "number" &&
    typeof value.read === "boolean"
  );
}

function validate(input: unknown): Stored {
  if (!isPlainObject(input)) return { seeded: false, entries: [] };
  const seeded = input.seeded === true;
  const entries = Array.isArray(input.entries) ? input.entries.filter(isNotification) : [];
  return { seeded, entries };
}

function readStored(): Stored {
  if (typeof window === "undefined") return { seeded: false, entries: [] };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { seeded: false, entries: [] };
    return validate(JSON.parse(raw));
  } catch {
    return { seeded: false, entries: [] };
  }
}

function writeStored(stored: Stored): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Quota / privacy mode — silently drop.
  }
}

function makeSeed(): Notification[] {
  const now = Date.now();
  return [
    {
      id: "seed-deep-1",
      kind: "deep-research-completed",
      title: "Deep research complete",
      body: "Your inquiry on the pause in revelation has eight new sources gathered.",
      href: "/research",
      createdAt: now - 1000 * 60 * 8,
      read: false,
    },
    {
      id: "seed-info-1",
      kind: "info",
      title: "Welcome to Mishkāt",
      body: "Notifications surface here when long-running searches finish.",
      href: null,
      createdAt: now - 1000 * 60 * 60 * 2,
      read: false,
    },
  ];
}

export function readNotifications(): readonly Notification[] {
  if (snapshot !== null) return snapshot;
  const stored = readStored();
  if (!stored.seeded) {
    const seeded: Stored = { seeded: true, entries: makeSeed() };
    writeStored(seeded);
    snapshot = Object.freeze([...seeded.entries]);
    return snapshot;
  }
  snapshot = Object.freeze([...stored.entries]);
  return snapshot;
}

export function markRead(id: string): void {
  const stored = readStored();
  const next: Stored = {
    seeded: true,
    entries: stored.entries.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)),
  };
  writeStored(next);
  notify();
}

export function clearAll(): void {
  writeStored({ seeded: true, entries: [] });
  notify();
}

export function pushNotification(
  input: Omit<Notification, "id" | "createdAt" | "read">,
): Notification {
  const stored = readStored();
  const created: Notification = {
    ...input,
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    read: false,
  };
  writeStored({ seeded: true, entries: [created, ...stored.entries] });
  notify();
  return created;
}
