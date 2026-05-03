"use client";

import clsx from "clsx";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { PlusIcon } from "@/components/Icon";
import { TemplatePicker } from "@/components/TemplatePicker/TemplatePicker";
import { updateNote } from "@/lib/api/notes";
import { findNote as findSampleNote } from "@/lib/mock-data";
import {
  createNoteFromTemplate,
  readUserNotes,
  subscribeUserNotes,
} from "@/lib/notes-store";
import { usePreferences } from "@/hooks/usePreferences";
import type { Note, Template } from "@/types";

import { NoteBody } from "./NoteBody";
import { NoteToolbar } from "./NoteToolbar";
import { SuggestionsRail } from "./SuggestionsRail";
import { VerseContext } from "./VerseContext";

type Props = {
  /** Active note id from `?note=<id>`. May resolve to a sample or user note. */
  noteId: string;
};

// Stable empty array reference — used as the SSR snapshot so React doesn't
// remount the rail's children unnecessarily during hydration.
const EMPTY_NOTES: readonly Note[] = [];

export function Journal({ noteId }: Props) {
  const { preferences } = usePreferences();

  // Subscribe to the user-notes store so any mutation (slash-command insert,
  // suggestion accept) re-renders the open note live. The server snapshot
  // returns an empty array; on the client we read fresh from localStorage.
  const userNotes = useSyncExternalStore(subscribeUserNotes, readUserNotes, () => EMPTY_NOTES);

  // Hybrid lookup: user store first (so a user-edited note shadows any
  // sample note with the same id), then sample notes.
  const note = resolveNote(noteId, userNotes);

  const showRail = preferences.suggestionsSurface === "rail";

  // Empty state when no note matches — render the right pane CTA instead of
  // the editor. Spec §10.6.
  if (!note) {
    return <JournalEmpty />;
  }

  const linkedAyah = parseLinkedAyah(note.link);

  return (
    <div className="journal">
      <div
        className="journal-pane"
        style={{
          flex: "0 0 38%",
          minWidth: 360,
          maxWidth: 540,
          background: "var(--color-bg-deep)",
        }}
      >
        <div className="pane-head">
          <span className="pane-title">Ad-Ḍuḥā · 93</span>
          <span className="pane-spacer" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--color-ink-4)",
            }}
          >
            linked to note
          </span>
        </div>
        <VerseContext linkedAyah={linkedAyah} />
      </div>

      <div className="journal-divider" />

      <div className="journal-pane right" style={{ flex: 1 }}>
        <NoteToolbar />
        <div
          className={clsx("note-doc-wrap", !showRail && "no-margin")}
          style={{ flex: 1, minHeight: 0 }}
        >
          <NoteBody
            // Remount the editor when the active note changes so local
            // editor state (body buffer, slash-menu position, template
            // insertion offset) starts fresh — avoids stale-state bugs and
            // lets NoteBody initialize body from props on each mount.
            key={note.id}
            note={note}
            onChangeBody={(nextBody, opts) => handleBodyChange(note, nextBody, opts)}
          />
          {showRail ? (
            <SuggestionsRail
              note={note}
              onInsert={(content) => handleInsertSuggestion(note, content)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function resolveNote(noteId: string, userNotes: readonly Note[]): Note | null {
  const userHit = userNotes.find((n) => n.id === noteId);
  if (userHit) return userHit;
  // Sample notes are static and ship with the bundle — safe to look up
  // synchronously on both server and client.
  return findSampleNote(noteId) ?? null;
}

function handleBodyChange(note: Note, nextBody: string, opts: { aiAssisted?: boolean }): void {
  // Only user-store notes are mutable in v3. For sample notes, this is a
  // no-op — the `lib/api/notes` updateNote wraps `updateUserNote` which
  // early-returns when the id isn't in the user store. Fire-and-forget:
  // the local store mutates synchronously, the live `useSyncExternalStore`
  // subscriber re-renders, and the returned promise resolves to the
  // updated note (or null) — we don't need it here.
  void updateNote(note.id, {
    body: nextBody,
    ...(opts.aiAssisted ? { aiAssisted: true, hasAi: true } : {}),
  });
}

function handleInsertSuggestion(note: Note, content: string): void {
  const trimmedBody = note.body.replace(/\s+$/u, "");
  const nextBody = trimmedBody.length === 0 ? content : `${trimmedBody}\n\n${content}`;
  void updateNote(note.id, { body: nextBody, aiAssisted: true, hasAi: true });
}

function JournalEmpty() {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = useCallback(
    (template: Template | null) => {
      const created = createNoteFromTemplate(template);
      router.push(`/journal?note=${encodeURIComponent(created.id)}`);
    },
    [router],
  );

  return (
    <div className="journal">
      <div className="journal-pane right" style={{ flex: 1 }}>
        <div className="journal-empty">
          <h2 className="ttl">Open a note from Library, or start a new one</h2>
          <p className="sub">
            A note can begin from a verse, a question, or a feeling. There is no wrong place to
            start.
          </p>
          <div className="journal-empty-actions">
            <button type="button" className="btn primary" onClick={() => setPickerOpen(true)}>
              <PlusIcon size={13} /> New note
            </button>
          </div>
        </div>
      </div>
      <TemplatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}

/**
 * Pulls the ayah number out of a `note.link` like `"93:3"` or `"93:6-8"`.
 * Returns 0 when the format doesn't match — the VerseContext will then just
 * render no row as "linked".
 */
function parseLinkedAyah(link: string): number {
  const match = /^\d+:(\d+)/.exec(link);
  if (!match) return 0;
  return Number(match[1]);
}
