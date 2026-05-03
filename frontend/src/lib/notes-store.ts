// Client-side overlay over the static SAMPLE_NOTES corpus. User-created notes
// (template-derived, seeded by onboarding, etc.) live here. Pure functions
// over localStorage — no React.
//
// Library reads merge `readUserNotes()` with `SAMPLE_NOTES`. Writes are
// best-effort: quota / privacy-mode failures are swallowed silently because
// losing a draft is preferable to a thrown error in a contemplative UI.
//
// Subscribers can listen via `subscribeUserNotes(listener)` and consume the
// store from React via `useSyncExternalStore`. Mutations call `notify()`,
// which busts a cached snapshot so the next read returns a fresh array
// (referential change is what triggers React to re-render).

import { isPlainObject, isReadonlyStringArray } from "@/lib/validators";
import type { Note, Template } from "@/types";

const STORAGE_KEY = "mishkat:notes:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

// Cached read-side snapshot. `useSyncExternalStore` requires a referentially
// stable snapshot across calls when nothing has changed. We rebuild it only
// after a mutation OR on first read.
let snapshot: readonly Note[] | null = null;

function notify(): void {
  // Bust the cached snapshot so the next read pulls fresh state.
  snapshot = null;
  for (const listener of listeners) listener();
}

export function subscribeUserNotes(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function validateNote(input: unknown): Note | null {
  if (!isPlainObject(input)) return null;
  const {
    id,
    title,
    preview,
    body,
    link,
    tags,
    editedRelative,
    editedAbsolute,
    editedAt,
    hasAi,
    aiAssisted,
    templateId,
    dismissedSuggestions,
  } = input;

  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof title !== "string") return null;
  if (typeof preview !== "string") return null;
  if (typeof body !== "string") return null;
  if (typeof link !== "string") return null;
  if (!isReadonlyStringArray(tags)) return null;
  if (typeof editedRelative !== "string") return null;
  if (typeof editedAbsolute !== "string") return null;
  if (typeof editedAt !== "string") return null;
  if (typeof hasAi !== "boolean") return null;
  if (typeof aiAssisted !== "boolean") return null;
  if (templateId !== null && typeof templateId !== "string") return null;
  if (!isReadonlyStringArray(dismissedSuggestions)) return null;

  return {
    id,
    title,
    preview,
    body,
    link,
    tags,
    editedRelative,
    editedAbsolute,
    editedAt,
    hasAi,
    aiAssisted,
    templateId,
    dismissedSuggestions,
  };
}

function validateNotes(input: unknown): readonly Note[] {
  if (!Array.isArray(input)) return [];
  const out: Note[] = [];
  for (const candidate of input) {
    const note = validateNote(candidate);
    if (note) out.push(note);
  }
  return out;
}

export function readUserNotes(): readonly Note[] {
  if (snapshot !== null) return snapshot;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      snapshot = Object.freeze([]);
      return snapshot;
    }
    const validated = validateNotes(JSON.parse(raw));
    snapshot = Object.freeze([...validated]);
    return snapshot;
  } catch {
    snapshot = Object.freeze([]);
    return snapshot;
  }
}

function writeUserNotes(notes: readonly Note[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Quota / privacy mode — silently drop.
  }
}

export function addUserNote(note: Note): void {
  const existing = readUserNotes();
  // Replace by id if a note with the same id already exists; otherwise append.
  const idx = existing.findIndex((n) => n.id === note.id);
  const next = idx === -1 ? [...existing, note] : existing.map((n, i) => (i === idx ? note : n));
  writeUserNotes(next);
  notify();
}

export function deleteUserNote(id: string): void {
  const existing = readUserNotes();
  const next = existing.filter((n) => n.id !== id);
  if (next.length !== existing.length) {
    writeUserNotes(next);
    notify();
  }
}

export function findUserNote(id: string): Note | null {
  return readUserNotes().find((n) => n.id === id) ?? null;
}

/**
 * Apply a partial patch to a user-created note. No-op if the note isn't in
 * the user store (sample notes are read-only — the v3 mock keeps them
 * pristine and lets user edits live alongside, not on top). Notifies
 * subscribers so live note views re-render.
 */
export function updateUserNote(id: string, patch: Partial<Omit<Note, "id">>): void {
  const existing = readUserNotes();
  const idx = existing.findIndex((n) => n.id === id);
  if (idx === -1) return;
  const current = existing[idx];
  if (!current) return;
  const next = existing.map((n, i) => (i === idx ? { ...current, ...patch, id: current.id } : n));
  writeUserNotes(next);
  notify();
}

// Build a markdown body from a template's sections. Each section becomes an
// H2 followed by an italicized placeholder prompt, separated by blank lines.
function buildBodyFromTemplate(template: Template): string {
  return template.sections
    .map((section) => `## ${section.heading}\n\n*${section.placeholder}*\n`)
    .join("\n");
}

// Derive a short preview string from a body. We strip markdown headers and
// emphasis markers so the Library card snippet reads as prose. Falls back to
// the empty string when the body is blank (the empty-note case).
function previewFromBody(body: string): string {
  if (body.length === 0) return "";
  const stripped = body
    .split("\n")
    .map((line) =>
      line
        .replace(/^#+\s*/, "")
        .replace(/^\*|\*$/g, "")
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join(" ");
  return stripped.slice(0, 180);
}

/**
 * Create a fresh user note from a template (or from blank). Generates a
 * collision-resistant id, stamps "Just now" timestamps, persists via
 * `addUserNote`, and returns the new note. Caller is responsible for
 * navigating to the note's journal page.
 */
export function createNoteFromTemplate(template: Template | null): Note {
  const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const body = template ? buildBodyFromTemplate(template) : "";
  const note: Note = {
    id,
    title: template ? template.name : "Untitled note",
    preview: previewFromBody(body),
    body,
    link: "",
    tags: [],
    editedRelative: "Just now",
    editedAbsolute: "Just now",
    editedAt: new Date().toISOString(),
    hasAi: false,
    aiAssisted: false,
    templateId: template?.id ?? null,
    dismissedSuggestions: [],
  };
  addUserNote(note);
  return note;
}
