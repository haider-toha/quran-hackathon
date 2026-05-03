"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ReactNode,
} from "react";

import {
  dismiss as dismissSuggestion,
  isDismissedIn,
  readDismissals,
  subscribeDismissals,
} from "@/lib/dismissal-store";
import { inlineSuggestionsFor, type InlineSuggestion } from "@/lib/inline-suggestions";
import { renderMarkdown } from "@/lib/markdown";
import type { Note } from "@/types";

import { FloatingSelectionToolbar, type SelectionEdit } from "./FloatingSelectionToolbar";
import { InlineSuggestionMirror } from "./InlineSuggestionMirror";
import { InlineSuggestionPopover } from "./InlineSuggestionPopover";
import { useJournalChrome } from "./JournalChromeContext";
import { SlashCommandMenu, type SlashApplyEdit } from "./SlashCommandMenu";

type Props = {
  note: Note;
  /** Persists body changes back to the user-notes store. The `aiAssisted`
   * flag flips true after any AI-generating slash command resolves. */
  onChangeBody?: (body: string, opts: { aiAssisted?: boolean }) => void;
  /** Anchor element rendered between the title and tag row in the metadata
   * stack. Typically the `AnchoredToLabel` button. */
  anchorSlot?: ReactNode;
};

// Tag values that look like a verse anchor (e.g. "93:3", "93:6-8") are the
// note's verse link masquerading as a tag — we strip them from the rendered
// tag row. Filter at render time without mutating the source data so a
// future tag editor still sees what the note has.
const VERSE_ANCHOR_TAG_RE = /^\d+:\d+(?:-\d+)?$/u;

export function NoteBody({ note, onChangeBody, anchorSlot = null }: Props) {
  const editorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [body, setBody] = useState<string>(note.body);

  // Inline suggestions (compose-mode only). Active when journal mode is
  // "compose"; hidden in connect mode where the rail handles all suggestions.
  const { mode } = useJournalChrome();
  const inlineActive = mode === "compose";

  // Subscribe to the dismissal store so inline-dismissed hashes hide
  // immediately. Inline dismissals share the same store as rail dismissals
  // — the `inline:` hash prefix keeps the two namespaces apart per spec.
  // First hydration render reads the empty `getServerDismissals` snapshot
  // so SSR and CSR DOM agree; real dismissals populate post-hydration.
  const dismissals = useSyncExternalStore(subscribeDismissals, readDismissals, getServerDismissals);
  const dismissedInlineHashes = useMemo<ReadonlySet<string>>(() => {
    const all = inlineSuggestionsFor(note.id);
    const dismissed = new Set<string>();
    for (const s of all) {
      if (isDismissedIn(dismissals, note.id, s.hash)) dismissed.add(s.hash);
    }
    return dismissed;
  }, [note.id, dismissals]);

  // Popover state. `null` ⇒ hidden. `anchor` is the keyword span the
  // user is hovering / focused.
  const [popover, setPopover] = useState<{
    suggestion: InlineSuggestion;
    anchor: HTMLElement;
  } | null>(null);

  // Refs to the wrapping element so hover-out detection can check whether
  // the pointer left the popover region (mark or popover card itself).
  const noteBodyWrapRef = useRef<HTMLDivElement>(null);

  // Note: no effect to re-sync `body` on note.id changes. The parent
  // (Journal.tsx) keys this component on `note.id` so a navigation between
  // notes remounts NoteBody, letting `useState(note.body)` re-initialize
  // cleanly. Avoids the setState-in-render anti-pattern entirely.

  // Auto-grow the textarea to fit its content. Done in a layout effect so
  // the height settles before paint. Kept simple — `scrollHeight` is fine
  // for the v3 mock; no virtualization needed.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  const persistBody = useCallback(
    (next: string, opts: { aiAssisted?: boolean } = {}) => {
      if (!onChangeBody) return;
      onChangeBody(next, opts);
    },
    [onChangeBody],
  );

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    setBody(next);
    persistBody(next, {});
    // Fire a typing event so the SuggestionsRail can re-arm its idle timer
    // when the "review on save" preference is on. We don't include the value
    // in the detail — the rail only needs the activity signal.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mishkat:note-typing"));
    }
  }

  // ── Inline-suggestion handlers ─────────────────────────────────────
  // Activate when the user enters a marked span. The mirror reports the
  // anchor; we open the popover at that position.
  const handleInlineActivate = useCallback((suggestion: InlineSuggestion, anchor: HTMLElement) => {
    setPopover({ suggestion, anchor });
  }, []);

  const handleInlineClose = useCallback(() => {
    setPopover(null);
  }, []);

  const handleInlineInsert = useCallback(() => {
    if (!popover) return;
    const trimmedBody = body.replace(/\s+$/u, "");
    const nextBody =
      trimmedBody.length === 0
        ? popover.suggestion.insert
        : `${trimmedBody}\n\n${popover.suggestion.insert}`;
    setBody(nextBody);
    persistBody(nextBody, { aiAssisted: true });
    // Dismiss after insert so the underline disappears.
    dismissSuggestion(note.id, popover.suggestion.hash);
    setPopover(null);
  }, [popover, body, persistBody, note.id]);

  const handleInlineDismiss = useCallback(() => {
    if (!popover) return;
    dismissSuggestion(note.id, popover.suggestion.hash);
    setPopover(null);
  }, [popover, note.id]);

  // Close the popover when the pointer leaves the note-body wrapper. Hover
  // jitters between mark and popover are tolerated because the popover
  // portals to body — pointer leaving the *wrapper* is the right signal.
  // Also closes when the user starts typing.
  useEffect(() => {
    if (!popover) return;
    function onPointerMove(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const wrapper = noteBodyWrapRef.current;
      if (wrapper && wrapper.contains(target)) return;
      // Pointer is outside the editor wrapper — also tolerate hovers
      // inside the portaled popover by checking the floating-card class.
      if (target instanceof HTMLElement && target.closest(".inline-suggestion-popover")) {
        return;
      }
      setPopover(null);
    }
    function onKeyDown() {
      // Any keystroke closes the popover so it doesn't linger over text
      // the user is editing.
      setPopover(null);
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [popover]);

  // Whether to show the read-only markdown preview alongside the editor.
  // Kept for sample notes whose bodies are pre-formatted markdown — fades
  // out the moment the user starts editing.
  const showPreview = body.length > 0 && body === note.body && note.id.startsWith("n");

  // Apply a structured edit (replace [start, end) with replacement, then
  // move the textarea selection to the requested offsets). Single helper
  // used by both the floating selection toolbar and the slash menu.
  function applyStructuredEdit(edit: SelectionEdit | SlashApplyEdit) {
    const next = body.slice(0, edit.start) + edit.replacement + body.slice(edit.end);
    setBody(next);
    persistBody(next, {});
    // Restore selection on the next paint so the textarea has the new
    // value when we set selectionStart/End.
    const ta = textareaRef.current;
    if (!ta) return;
    window.requestAnimationFrame(() => {
      ta.focus();
      try {
        ta.setSelectionRange(edit.newSelectionStart, edit.newSelectionEnd);
      } catch {
        // setSelectionRange can throw if the textarea is unmounting — safe
        // to swallow; the edit still landed.
      }
    });
  }

  // Filter out tags that match a verse-anchor shape, share the body
  // verse-link, or are blank.
  const visibleTags = note.tags.filter(
    (tag) => !VERSE_ANCHOR_TAG_RE.test(tag) && tag !== note.link,
  );

  return (
    <div className="note-doc">
      <div className="journal-v2-meta">
        <h1 className="journal-v2-meta-title">{note.title}</h1>
        {anchorSlot ? <div className="journal-v2-meta-anchor">{anchorSlot}</div> : null}
        {visibleTags.length > 0 ? (
          <div className="journal-v2-meta-tags" aria-label="Tags">
            {visibleTags.map((tag, idx) => (
              <span key={tag} className="journal-v2-meta-tag">
                {idx > 0 ? (
                  <span className="journal-v2-meta-tag-sep" aria-hidden>
                    ·
                  </span>
                ) : null}
                <span className="journal-v2-meta-tag-text">{tag}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="note-body" ref={noteBodyWrapRef}>
        <div className="note-body-editor-wrap">
          <textarea
            id={editorId}
            ref={textareaRef}
            className="note-body-editor"
            value={body}
            onChange={handleChange}
            aria-label="Note body"
            spellCheck
            placeholder="Begin where you are."
          />
          {inlineActive ? (
            <InlineSuggestionMirror
              noteId={note.id}
              body={body}
              dismissedHashes={dismissedInlineHashes}
              onMarkActivate={handleInlineActivate}
            />
          ) : null}
        </div>
        {showPreview ? (
          <div className="note-body-preview" aria-hidden>
            {renderMarkdown(body)}
          </div>
        ) : null}
      </div>

      {inlineActive ? (
        <InlineSuggestionPopover
          suggestion={popover?.suggestion ?? null}
          anchor={popover?.anchor ?? null}
          onInsert={handleInlineInsert}
          onDismiss={handleInlineDismiss}
          onClose={handleInlineClose}
        />
      ) : null}

      {/* Floating selection toolbar (shows on text selection) and slash-
          command menu (shows on `/` typed at line start). Both write through
          the controlled-component flow via applyStructuredEdit so the body
          buffer stays the source of truth. */}
      <FloatingSelectionToolbar
        textareaRef={textareaRef}
        body={body}
        onApply={applyStructuredEdit}
      />
      <SlashCommandMenu textareaRef={textareaRef} body={body} onApply={applyStructuredEdit} />
    </div>
  );
}

// Stable empty server snapshot for useSyncExternalStore, mirroring the
// pattern used in SuggestionsRail. Returning the same reference each call
// means React won't think the snapshot is mutating between renders during
// SSR.
const SERVER_DISMISSALS = Object.freeze({});
function getServerDismissals(): typeof SERVER_DISMISSALS {
  return SERVER_DISMISSALS;
}
