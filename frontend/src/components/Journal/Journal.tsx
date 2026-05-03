"use client";

// Journal — mode-aware layout with three modes:
//
//   - Compose: writing pane dominates. ComposeRail (80-px) on the left;
//     ConnectionsIndicator pinned bottom-right of the writing pane.
//     AppShell sidebar collapses to icons; topbar hides search and
//     surfaces a small mode switcher.
//
//   - Connect: 3-column layout (verse pane + editor + suggestions rail).
//
//   - Map: full-bleed connections graph across all notes.
//
// Mode is persisted PER-NOTE via `lib/journal-mode-store`. Default for a
// note with no stored value is Compose. The keyboard shortcut `Cmd/Ctrl+.`
// and an explicit topbar button toggle modes.

import clsx from "clsx";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { PlusIcon } from "@/components/Icon";
import { TemplatePicker } from "@/components/TemplatePicker/TemplatePicker";
import { useJournalMode } from "@/hooks/useJournalMode";
import { usePreferences } from "@/hooks/usePreferences";
import { updateNote } from "@/lib/api/notes";
import { findNote as findSampleNote, SAMPLE_NOTES } from "@/lib/mock-data";
import { createNoteFromTemplate, readUserNotes, subscribeUserNotes } from "@/lib/notes-store";
import type { Note, Template } from "@/types";

import { AnchoredToLabel } from "./AnchoredToLabel";
import { ComposeRail } from "./ComposeRail";
import { ConnectionsIndicator } from "./ConnectionsIndicator";
import { useChromeBinding } from "./JournalChromeContext";
import { JournalMap } from "./JournalMap";
import { NoteBody } from "./NoteBody";
import { NoteOverflowMenu } from "./NoteOverflowMenu";
import { SuggestionsRail } from "./SuggestionsRail";
import { TranslationWatermark } from "./TranslationWatermark";
import { VerseContext } from "./VerseContext";

type Props = {
  noteId: string;
};

const EMPTY_NOTES: readonly Note[] = [];

export function Journal({ noteId }: Props) {
  const { preferences } = usePreferences();
  const userNotes = useSyncExternalStore(subscribeUserNotes, readUserNotes, () => EMPTY_NOTES);
  const note = resolveNote(noteId, userNotes);

  // Hooks must run unconditionally — `useJournalMode` is called even on the
  // empty-state branch (with the resolved-or-empty noteId) so the hook
  // ordering is stable across renders.
  const { mode, setMode, toggleMode } = useJournalMode(note?.id ?? noteId);

  // Cmd/Ctrl + Period toggles the mode. Listens at the document level so
  // any focused element (editor, sidebar, etc) can fire the toggle.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;
      if (event.key !== ".") return;
      event.preventDefault();
      toggleMode();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggleMode]);

  // Topbar's mode switcher fires a custom event because it doesn't know
  // the active noteId. We bridge that here, mapping the event payload to
  // the persisted per-note mode store.
  useEffect(() => {
    function onSetMode(event: Event) {
      const detail = (event as CustomEvent<{ mode?: unknown }>).detail;
      if (!detail) return;
      const next = detail.mode;
      if (next === "compose" || next === "connect" || next === "map") setMode(next);
    }
    document.addEventListener("mishkat:journal-set-mode", onSetMode);
    return () => document.removeEventListener("mishkat:journal-set-mode", onSetMode);
  }, [setMode]);

  const showSuggestionsRail = preferences.suggestionsSurface === "rail";

  // Publish the active mode up to the AppShell-level chrome context so the
  // sidebar can collapse to icons and the topbar can swap its right cluster.
  // The empty-state branch publishes "connect" so the chrome behaves like
  // a normal page (no overrides) until the user picks a note.
  useChromeBinding(note !== null, note ? mode : "connect");

  if (!note) {
    return <JournalEmpty />;
  }

  const linkedAyah = parseLinkedAyah(note.link);

  // Map mode is full-bleed and shares the user-notes pool with the rest of
  // the app so the JournalMap component can find related entries from both
  // the static SAMPLE_NOTES corpus and any notes the user has created
  // locally. We compute the merged list once per render — `userNotes` is
  // referentially stable between mutations so the identity of the array
  // passed into JournalMap is stable too.
  const allNotes: readonly Note[] = [...SAMPLE_NOTES, ...userNotes];

  return (
    <div className={clsx("journal-v2", `journal-v2-mode-${mode}`)} data-journal-mode={mode}>
      {mode === "compose" ? (
        <ComposeView
          note={note}
          linkedAyah={linkedAyah}
          onActivateConnect={() => setMode("connect")}
        />
      ) : mode === "map" ? (
        <JournalMap
          // Re-mount on note change so the entry-fade animation re-runs and
          // we don't reuse a cached SVG keyed to the previous note's
          // connection list.
          key={note.id}
          note={note}
          allNotes={allNotes}
          onReturnToCompose={() => setMode("compose")}
        />
      ) : (
        <ConnectView note={note} linkedAyah={linkedAyah} showRail={showSuggestionsRail} />
      )}
    </div>
  );
}

type ComposeViewProps = {
  note: Note;
  linkedAyah: number;
  onActivateConnect: () => void;
};

function ComposeView({ note, linkedAyah, onActivateConnect }: ComposeViewProps) {
  return (
    <>
      <ComposeRail linkedAyah={linkedAyah} />
      {/* `key={note.id}` so the entry-fade keyframe re-runs each time the
          user navigates between notes — every note gets the same brief
          ritual of arrival. */}
      <div key={note.id} className="journal-v2-pane journal-v2-enter-pane">
        <NoteOverflowMenu note={note} />
        <div className="journal-v2-doc-wrap">
          <NoteBody
            // Remount the editor when the active note changes so local
            // editor state (body buffer, slash-menu position) starts fresh
            // — avoids stale-state bugs.
            key={note.id}
            note={note}
            onChangeBody={(nextBody, opts) => handleBodyChange(note, nextBody, opts)}
            // The AnchoredToLabel slot lands BETWEEN the title and the
            // tag row inside NoteBody's metadata stack.
            anchorSlot={<AnchoredToLabel link={note.link} mode="compose" ayah={linkedAyah} />}
          />
        </div>
        {/* Watermark is a SIBLING of the scroll container — anchored to
            the pane's top-right so it stays in view as the user scrolls.
            Listens to the scroll container internally to drive the
            fade-in past ~200px. */}
        <TranslationWatermark linkedAyah={linkedAyah} />
        {/* Indicator is a SIBLING of the scroll container so it stays
            pinned to the pane's bottom-right rather than scrolling with
            the editor body. */}
        <ConnectionsIndicator noteId={note.id} onActivate={onActivateConnect} />
        {/* Edit timestamp pinned to the pane's bottom-right. Visibility
            is driven by the pane's :hover/:focus-within state via
            .journal-v2-edited CSS — no JS needed. */}
        <span className="journal-v2-edited" aria-live="polite">
          Edited {note.editedRelative}
        </span>
      </div>
    </>
  );
}

type ConnectViewProps = {
  note: Note;
  linkedAyah: number;
  showRail: boolean;
};

function ConnectView({ note, linkedAyah, showRail }: ConnectViewProps) {
  return (
    // The 3-column connect layout uses the `.journal` / `.journal-pane` /
    // `.note-doc-wrap` class hierarchy so the existing CSS handles every
    // measurement here without modification.
    <div className="journal" style={{ width: "100%" }}>
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
          <span className="pane-title">Ad-Duha · 93</span>
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

      {/* `key={note.id}` keeps the entry-fade in sync with note navigation
          — same pattern as ComposeView so connect-mode notes also get the
          brief writing-pane fade-in on switch. */}
      <div
        key={note.id}
        className="journal-pane right journal-v2-pane journal-v2-enter-pane"
        style={{ flex: 1 }}
      >
        <NoteOverflowMenu note={note} />
        <div
          className={clsx("note-doc-wrap", !showRail && "no-margin")}
          style={{ flex: 1, minHeight: 0 }}
        >
          <NoteBody
            key={note.id}
            note={note}
            onChangeBody={(nextBody, opts) => handleBodyChange(note, nextBody, opts)}
            // Same anchor-slot pattern as ComposeView — the AnchoredToLabel
            // sits between the title and the tag row.
            anchorSlot={<AnchoredToLabel link={note.link} mode="connect" ayah={linkedAyah} />}
          />
          {showRail ? (
            <SuggestionsRail
              note={note}
              onInsert={(content) => handleInsertSuggestion(note, content)}
            />
          ) : null}
        </div>
        <span className="journal-v2-edited" aria-live="polite">
          Edited {note.editedRelative}
        </span>
      </div>
    </div>
  );
}

function resolveNote(noteId: string, userNotes: readonly Note[]): Note | null {
  const userHit = userNotes.find((n) => n.id === noteId);
  if (userHit) return userHit;
  return findSampleNote(noteId) ?? null;
}

function handleBodyChange(note: Note, nextBody: string, opts: { aiAssisted?: boolean }): void {
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

function parseLinkedAyah(link: string): number {
  const match = /^\d+:(\d+)/.exec(link);
  if (!match) return 0;
  return Number(match[1]);
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
