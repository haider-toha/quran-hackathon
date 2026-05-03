// Ephemeral toast store — a sibling of `notifications-store` but for
// micro-feedback ("Copied", "Saved"). Toasts are not persisted; they live
// in-memory only. The `<Toaster />` component subscribes via
// `useSyncExternalStore` and renders the active stack.
//
// Each toast auto-dismisses after `durationMs`. Dismissal is two-phase:
// `dismissToast(id)` flips `exiting: true` so the Toaster can play an exit
// animation, then `removeToast(id)` actually drops it. This avoids the
// React-Spring dance for what is fundamentally a couple of opacity tweens.

export type ToastVariant = "success" | "info" | "error";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
};

type Listener = () => void;
const listeners = new Set<Listener>();

let entries: readonly Toast[] = [];
let snapshot: readonly Toast[] = entries;

const SHOW_DURATION_MS = 1800;
const EXIT_ANIMATION_MS = 180;

function notify(): void {
  snapshot = entries;
  for (const listener of listeners) listener();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readToasts(): readonly Toast[] {
  return snapshot;
}

export function readEmptyToasts(): readonly Toast[] {
  return EMPTY_TOASTS;
}

const EMPTY_TOASTS: readonly Toast[] = Object.freeze([]);

function makeId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type ShowToastOptions = {
  variant?: ToastVariant;
  durationMs?: number;
};

export function showToast(message: string, options: ShowToastOptions = {}): string {
  const id = makeId();
  const toast: Toast = {
    id,
    message,
    variant: options.variant ?? "success",
    exiting: false,
  };
  entries = [...entries, toast];
  notify();

  const duration = options.durationMs ?? SHOW_DURATION_MS;
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export function dismissToast(id: string): void {
  const target = entries.find((t) => t.id === id);
  if (!target || target.exiting) return;
  entries = entries.map((t) => (t.id === id ? { ...t, exiting: true } : t));
  notify();
  if (typeof window !== "undefined") {
    window.setTimeout(() => removeToast(id), EXIT_ANIMATION_MS);
  }
}

function removeToast(id: string): void {
  const before = entries.length;
  entries = entries.filter((t) => t.id !== id);
  if (entries.length !== before) notify();
}
