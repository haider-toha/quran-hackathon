// Notes data access. Wraps the localStorage-backed `notes-store` in async
// signatures so the migration to a server-backed notes API doesn't ripple
// through every call site.

import { SAMPLE_NOTES } from "@/lib/mock-data";
import {
  addUserNote,
  deleteUserNote,
  findUserNote,
  readUserNotes,
  updateUserNote,
} from "@/lib/notes-store";
import type { Note } from "@/types";

export type CreateNoteInput = Omit<
  Note,
  "id" | "editedRelative" | "editedAbsolute" | "editedAt"
> & {
  id?: string;
};

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Return every note visible to the user — sample notes seeded by the v3 mock
 * plus any user-created notes saved in localStorage. Sample notes come last
 * so that user notes (most-recently created) sort above the seeded corpus.
 */
export async function listNotes(): Promise<readonly Note[]> {
  const userNotes = readUserNotes();
  return [...userNotes, ...SAMPLE_NOTES];
}

/**
 * Look up a note by id. Returns `null` when the note isn't found in either
 * the user store or the sample corpus.
 */
export async function getNote(id: string): Promise<Note | null> {
  const userNote = findUserNote(id);
  if (userNote) return userNote;
  const sample = SAMPLE_NOTES.find((n) => n.id === id);
  return sample ?? null;
}

/**
 * Create a new note in the user store. The store stamps "Just now"
 * timestamps and persists. Caller may pass an id; if omitted, one is
 * generated. Returns the persisted note.
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const id = input.id ?? makeId();
  const now = new Date().toISOString();
  const note: Note = {
    id,
    title: input.title,
    preview: input.preview,
    body: input.body,
    link: input.link,
    tags: input.tags,
    editedRelative: "Just now",
    editedAbsolute: "Just now",
    editedAt: now,
    hasAi: input.hasAi,
    aiAssisted: input.aiAssisted,
    templateId: input.templateId,
    dismissedSuggestions: input.dismissedSuggestions,
  };
  addUserNote(note);
  return note;
}

/**
 * Patch an existing user note. No-op for sample notes (which are read-only
 * in the v3 mock). Returns the updated note, or `null` when the id isn't a
 * user note.
 *
 * After the local-store mutation, dispatches `mishkat:note-saved` so the
 * SuggestionsRail (and any other listener wiring "review on save") can
 * react. Server-side / non-window environments are skipped.
 */
export async function updateNote(
  id: string,
  patch: Partial<Omit<Note, "id">>,
): Promise<Note | null> {
  updateUserNote(id, patch);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<{ noteId: string }>("mishkat:note-saved", { detail: { noteId: id } }),
    );
  }
  return findUserNote(id);
}

/**
 * Delete a user note. No-op for sample notes.
 */
export async function deleteNote(id: string): Promise<void> {
  deleteUserNote(id);
}
