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

import { LinkIcon, SparkleIcon } from "@/components/Icon";
import { SlashMenu } from "@/components/SlashMenu/SlashMenu";
import { TemplatePicker } from "@/components/TemplatePicker/TemplatePicker";
import { useSlashMenuInternal } from "@/hooks/useSlashMenu";
import {
  dismiss as dismissSuggestion,
  isDismissed,
  readDismissals,
  subscribeDismissals,
} from "@/lib/dismissal-store";
import { inlineSuggestionsFor, type InlineSuggestion } from "@/lib/inline-suggestions";
import { renderMarkdown } from "@/lib/markdown";
import { runSlashCommand } from "@/lib/slash-commands";
import type { Note, SlashCommand, SlashCommandResult, Template } from "@/types";

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
  /** When true, the verse-link pill in the metadata strip is hidden — used
   * by JournalV2 (Phase 3) where the "Anchored to ..." label above the
   * title is the authoritative anchor affordance. Defaults to false so the
   * legacy layout keeps its pill. */
  hideAnchorPill?: boolean;
  /** When true, the V2 metadata stack is rendered: title (styled heading)
   * → anchor slot → tags-as-text. The legacy meta strip and toolbar-
   * facing slash-menu/legacy-template flow are also disabled. */
  v2Layout?: boolean;
  /** Optional anchor element rendered between the title and tag row in
   * V2 layout. Typically the `AnchoredToLabel` button. */
  anchorSlot?: ReactNode;
};

// Tag values that look like a verse anchor (e.g. "93:3", "93:6-8") are the
// note's verse link masquerading as a tag — Phase 3 strips them from the
// rendered tag row. We filter at render time without mutating the source
// data so a future tag editor still sees what the note has.
const VERSE_ANCHOR_TAG_RE = /^\d+:\d+(?:-\d+)?$/u;

// Loading placeholder — we replace this with the actual result content once
// the mock async runner resolves. Kept short so it doesn't visually dominate
// the document while the user is reading.
const LOADING_TOKEN = "[loading…]";

export function NoteBody({
  note,
  onChangeBody,
  hideAnchorPill = false,
  v2Layout = false,
  anchorSlot = null,
}: Props) {
  const editorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [body, setBody] = useState<string>(note.body);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  // Tracks where to insert the template's sections when the picker resolves.
  // Set when the user runs `/template` from inline; cleared when the picker
  // closes without selection.
  const [templateInsertionAt, setTemplateInsertionAt] = useState<number | null>(null);

  const slash = useSlashMenuInternal(textareaRef);

  // Inline suggestions (compose-mode only). Active when journal mode is
  // "compose"; hidden in connect mode where the rail handles all suggestions.
  const { mode } = useJournalChrome();
  const inlineActive = mode === "compose";

  // Subscribe to the dismissal store so inline-dismissed hashes hide
  // immediately. Inline dismissals share the same store as rail dismissals
  // — the `inline:` hash prefix keeps the two namespaces apart per spec.
  useSyncExternalStore(subscribeDismissals, readDismissals, getServerDismissals);
  const dismissedInlineHashes = useMemo<ReadonlySet<string>>(() => {
    const all = inlineSuggestionsFor(note.id);
    const dismissed = new Set<string>();
    for (const s of all) {
      if (isDismissed(note.id, s.hash)) dismissed.add(s.hash);
    }
    return dismissed;
  }, [note.id]);

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
    // V2 uses its own SlashCommandMenu with internal change detection; the
    // legacy slash hook is bypassed so we don't double-count the trigger.
    if (!v2Layout) {
      slash.onTextChange(next, event.target.selectionStart ?? next.length);
    }
    // Fire a typing event so the SuggestionsRail can re-arm its idle timer
    // when the "review on save" preference is on. We don't include the value
    // in the detail — the rail only needs the activity signal.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mishkat:note-typing"));
    }
  }

  function handleSelectionChange(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
    if (v2Layout) return;
    slash.onTextChange(target.value, target.selectionStart ?? target.value.length);
  }

  /**
   * Replace [start, end) in the body with `replacement` and persist the
   * result. Returns the updated body. If `aiAssisted` is true, marks the
   * note as AI-assisted in the store.
   */
  function replaceRange(
    start: number,
    end: number,
    replacement: string,
    opts: { aiAssisted?: boolean } = {},
  ): string {
    const nextBody = body.slice(0, start) + replacement + body.slice(end);
    setBody(nextBody);
    persistBody(nextBody, opts);
    return nextBody;
  }

  async function handleSlashSelect(command: SlashCommand) {
    if (slash.startOffset === null) return;
    const startOffset = slash.startOffset;
    const caret = textareaRef.current?.selectionStart ?? body.length;
    const args = body.slice(startOffset + 1 + command.trigger.length, caret).trim();

    slash.close();

    // /template opens the picker inline; selection is appended at the slash
    // command position, not the cursor (the cursor ends up after the
    // appended sections).
    if (command.id === "template") {
      replaceRange(startOffset, caret, "", {});
      setTemplateInsertionAt(startOffset);
      setTemplatePickerOpen(true);
      return;
    }

    // Insert a loading placeholder where the command was issued.
    const loadingText = LOADING_TOKEN;
    const afterLoadingBody = replaceRange(startOffset, caret, loadingText, {});

    let result: SlashCommandResult;
    try {
      result = await runSlashCommand(command, args);
    } catch {
      const errorText = "[error: command failed]";
      const errorIdx = afterLoadingBody.indexOf(loadingText);
      if (errorIdx >= 0) {
        const next =
          afterLoadingBody.slice(0, errorIdx) +
          errorText +
          afterLoadingBody.slice(errorIdx + loadingText.length);
        setBody(next);
        persistBody(next, {});
      }
      return;
    }

    const latest = textareaRef.current?.value ?? afterLoadingBody;
    const loadIdx = latest.indexOf(loadingText);
    if (loadIdx === -1) return;

    const formatted = formatSlashResultAsMarkdown(command, result);
    const next = latest.slice(0, loadIdx) + formatted + latest.slice(loadIdx + loadingText.length);
    setBody(next);
    persistBody(next, { aiAssisted: result.aiGenerated });
  }

  function handleTemplatePicked(template: Template | null) {
    setTemplatePickerOpen(false);
    if (!template) {
      setTemplateInsertionAt(null);
      return;
    }
    const at = templateInsertionAt ?? body.length;
    const sections = template.sections
      .map((s) => `## ${s.heading}\n\n*${s.placeholder}*\n`)
      .join("\n");
    // Always prefix with a blank line if the insertion point isn't at the
    // start of the document, so the new sections render as separate blocks.
    const sep = at > 0 && !body.slice(0, at).endsWith("\n\n") ? "\n\n" : "";
    const insertion = `${sep}${sections}`;
    replaceRange(at, at, insertion, {});
    setTemplateInsertionAt(null);
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

  // V2 path applies a structured edit (replace [start, end) with replacement,
  // then move the textarea selection to the requested offsets). Single
  // helper used by both the floating selection toolbar and the slash menu.
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
  // verse-link, or are blank — same predicate the legacy strip uses.
  const visibleTags = note.tags.filter(
    (tag) => !VERSE_ANCHOR_TAG_RE.test(tag) && tag !== note.link,
  );

  return (
    <div className="note-doc">
      {v2Layout ? (
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
      ) : (
        <>
          <input className="note-title" defaultValue={note.title} aria-label="Note title" />

          <div className="note-meta">
            {hideAnchorPill ? null : (
              <span className="verse-link-pill">
                <LinkIcon size={11} /> {note.link || "no verse link"}
              </span>
            )}
            {visibleTags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
            <span style={{ marginLeft: "auto" }}>Edited {note.editedRelative} · auto-saved</span>
          </div>
        </>
      )}

      <div className="note-body" ref={noteBodyWrapRef}>
        <div className="note-body-editor-wrap">
          <textarea
            id={editorId}
            ref={textareaRef}
            className="note-body-editor"
            value={body}
            onChange={handleChange}
            onSelect={handleSelectionChange}
            onClick={handleSelectionChange}
            aria-label="Note body"
            spellCheck
            placeholder={
              // Phase 7: V2 quiets the placeholder to a single tonal phrase.
              // The textarea only renders the placeholder when its value is
              // empty (or whitespace-only — handled by browsers naturally),
              // so this string surfaces solely for fresh notes.
              v2Layout
                ? "Begin where you are."
                : "Begin from a verse, a question, or a feeling. There is no wrong place to start."
            }
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

      {v2Layout ? (
        <>
          {/* Phase 4: V2-mode floating selection toolbar (shows on text
              selection) and slash-command menu (shows on `/` typed at line
              start). Both write through the controlled-component flow via
              applyStructuredEdit so the body buffer stays the source of
              truth. */}
          <FloatingSelectionToolbar
            textareaRef={textareaRef}
            body={body}
            onApply={applyStructuredEdit}
          />
          <SlashCommandMenu textareaRef={textareaRef} body={body} onApply={applyStructuredEdit} />
        </>
      ) : (
        <SlashMenu
          anchor={slash.anchor}
          open={slash.open}
          query={slash.query}
          onSelect={handleSlashSelect}
          onClose={slash.close}
        />
      )}

      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => {
          setTemplatePickerOpen(false);
          setTemplateInsertionAt(null);
        }}
        onSelect={handleTemplatePicked}
      />
    </div>
  );
}

/**
 * Format a slash-command result as markdown for the note body. AI-generated
 * results carry "(AI-generated)" in their label per spec §10.5. We never
 * imply the AI is the source.
 */
function formatSlashResultAsMarkdown(command: SlashCommand, result: SlashCommandResult): string {
  const aiTag = result.aiGenerated ? " (AI-generated)" : "";
  const src = result.source;

  switch (command.id) {
    case "search": {
      const heading = `## Search results${aiTag}`;
      return `${heading}\n\n${result.content}\n${src ? `\n*Sources: ${src.name} · ${src.ref}*\n` : ""}`;
    }
    case "ayah": {
      const ref = src?.ref ?? "";
      const heading = ref ? `## Verse · ${ref}` : "## Verse";
      return `${heading}\n\n${result.content}\n${src ? `\n*${src.name}, ${src.ref}*\n` : ""}`;
    }
    case "summarise": {
      const subject = src?.name ? `Summary of ${src.name}` : "Summary";
      return `## ${subject}${aiTag}\n\n${result.content}\n${src ? `\n*${src.name}${src.ref ? `, ${src.ref}` : ""}*\n` : ""}`;
    }
    case "reflect": {
      const heading = `## Reflection${aiTag}`;
      return `${heading}\n\n*${result.content}*\n`;
    }
    default:
      return result.content;
  }
}

/**
 * Render an AI-generated insert card icon. Reserved for future inline-card
 * UIs (e.g. accept/reject pending state) — exported for callers that render
 * AI attribution alongside content.
 */
export function AiAssistedBadge() {
  return (
    <span className="ai-badge" aria-label="AI-generated content">
      <SparkleIcon size={10} />
    </span>
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
