// Lightweight, dev-only feature flags read from localStorage. Independent of
// the in-app `useFeatureFlags` (which manages user-visible flags in a React
// context); these are intentionally a separate store keyed under
// `mishkat:ff:*` so devs can toggle UI experiments from devtools without
// involving the persisted preferences shape.
//
// Pure functions, React-free. The companion `useFeatureFlag` hook subscribes
// to changes via `subscribeFeatureFlag` so any flag flip from devtools or
// another tab re-renders consumers.

const FLAG_PREFIX = "mishkat:ff:";

export type DevFeatureFlag = "journalV2";

// Per-flag pub/sub. Listeners are registered on subscribe and called from
// `notifyFeatureFlag` (after a write) and from the storage event listener
// installed lazily on first subscribe (so cross-tab toggles propagate).
type Listener = () => void;
const listeners = new Map<DevFeatureFlag, Set<Listener>>();
let storageListenerInstalled = false;

function flagKey(flag: DevFeatureFlag): string {
  return `${FLAG_PREFIX}${flag}`;
}

function getListeners(flag: DevFeatureFlag): Set<Listener> {
  let set = listeners.get(flag);
  if (!set) {
    set = new Set<Listener>();
    listeners.set(flag, set);
  }
  return set;
}

function ensureStorageListener(): void {
  if (storageListenerInstalled) return;
  if (typeof window === "undefined") return;
  storageListenerInstalled = true;
  window.addEventListener("storage", (event) => {
    if (event.key === null) {
      // localStorage.clear() — bust every flag.
      for (const set of listeners.values()) for (const fn of set) fn();
      return;
    }
    if (!event.key.startsWith(FLAG_PREFIX)) return;
    const flag = event.key.slice(FLAG_PREFIX.length) as DevFeatureFlag;
    const set = listeners.get(flag);
    if (!set) return;
    for (const fn of set) fn();
  });
}

/**
 * Read a flag. Defaults to ON for `journalV2` — dev sets `"0"` to disable.
 * SSR-safe: returns the flag's default when `window` is undefined.
 */
export function isFeatureFlagEnabled(flag: DevFeatureFlag): boolean {
  if (typeof window === "undefined") return defaultFor(flag);
  try {
    const raw = window.localStorage.getItem(flagKey(flag));
    if (raw === null) return defaultFor(flag);
    return raw !== "0";
  } catch {
    return defaultFor(flag);
  }
}

/** Convenience: defaults-on read for the journal v2 layout. */
export function isJournalV2Enabled(): boolean {
  return isFeatureFlagEnabled("journalV2");
}

/**
 * Subscribe to changes in a single flag. Returns an unsubscribe fn. Internal
 * pub/sub is paired with a window `storage` event listener installed lazily
 * on first subscribe so cross-tab toggles also propagate.
 */
export function subscribeFeatureFlag(flag: DevFeatureFlag, listener: Listener): () => void {
  ensureStorageListener();
  const set = getListeners(flag);
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

function defaultFor(flag: DevFeatureFlag): boolean {
  // V2 layouts ship ON by default. Dev disables individually via
  // `localStorage.setItem("mishkat:ff:<flag>", "0")`.
  switch (flag) {
    case "journalV2":
      return true;
    default:
      return false;
  }
}
