"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from "react";

import { LinkIcon, SparkleIcon } from "@/components/Icon";
import { SlashMenu } from "@/components/SlashMenu/SlashMenu";
import { TemplatePicker } from "@/components/TemplatePicker/TemplatePicker";
import { runSlashCommand } from "@/lib/slash-commands";
import type { Note, SlashCommand, SlashCommandResult, Template } from "@/types";

import { renderMarkdown } from "./markdown";

type Props = {
  note: Note;
  /** Persists body changes back to the user-notes store. The `aiAssisted`
   * flag flips true after any AI-generating slash command resolves. */
  onChangeBody?: (body: string, opts: { aiAssisted?: boolean }) => void;
};

type SlashContext = {
  /** Caret coordinate for the SlashMenu virtual anchor. */
  anchor: { x: number; y: number };
  /** Index in body where the leading "/" sits. */
  startOffset: number;
  /** Latest typed query (everything between "/" and current caret). */
  query: string;
};

// Loading placeholder — we replace this with the actual result content once
// the mock async runner resolves. Kept short so it doesn't visually dominate
// the document while the user is reading.
const LOADING_TOKEN = "[loading…]";

export function NoteBody({ note, onChangeBody }: Props) {
  const editorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const [body, setBody] = useState<string>(note.body);
  const [lastNoteId, setLastNoteId] = useState<string>(note.id);
  const [slash, setSlash] = useState<SlashContext | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  // Tracks where to insert the template's sections when the picker resolves.
  // Set when the user runs `/template` from inline; cleared when the picker
  // closes without selection.
  const [templateInsertionAt, setTemplateInsertionAt] = useState<number | null>(null);

  // Re-sync local body when the note id changes (navigating between notes).
  // React 19 idiom: derive state during render rather than firing a layout
  // effect. The setState call inside an `if` branch is allowed because it
  // only fires during render of a new note id.
  if (lastNoteId !== note.id) {
    setLastNoteId(note.id);
    setBody(note.body);
  }

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
    updateSlashContext(next, event.target.selectionStart ?? next.length);
  }

  /**
   * Inspect the body around the current caret and decide whether the slash
   * menu should be open. Trigger rules: a "/" at start-of-line OR after
   * whitespace, with no whitespace between the "/" and the caret.
   */
  function updateSlashContext(text: string, caret: number) {
    let i = caret - 1;
    let queryStart = -1;
    while (i >= 0) {
      const ch = text[i];
      if (ch === undefined) break;
      if (/\s/u.test(ch)) {
        // Hit whitespace before finding our slash — no open menu.
        break;
      }
      if (ch === "/") {
        const prev = i === 0 ? "" : (text[i - 1] ?? "");
        if (prev === "" || /\s/u.test(prev)) {
          queryStart = i;
        }
        break;
      }
      i -= 1;
    }

    if (queryStart === -1) {
      setSlash(null);
      return;
    }

    const rawQuery = text.slice(queryStart + 1, caret);
    if (rawQuery.length > 32) {
      setSlash(null);
      return;
    }

    const anchor = caretCoordsFromTextarea(textareaRef.current, mirrorRef.current, caret);
    setSlash({ anchor, startOffset: queryStart, query: rawQuery });
  }

  function closeSlash() {
    setSlash(null);
  }

  function handleSelectionChange(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
    updateSlashContext(target.value, target.selectionStart ?? target.value.length);
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
    if (!slash) return;
    const startOffset = slash.startOffset;
    const caret = textareaRef.current?.selectionStart ?? body.length;
    const args = body.slice(startOffset + 1 + command.trigger.length, caret).trim();

    setSlash(null);

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

  // Whether to show the read-only markdown preview alongside the editor.
  // Kept for sample notes whose bodies are pre-formatted markdown — fades
  // out the moment the user starts editing.
  const showPreview = body.length > 0 && body === note.body && note.id.startsWith("n");

  return (
    <div className="note-doc">
      <input className="note-title" defaultValue={note.title} aria-label="Note title" />

      <div className="note-meta">
        <span className="verse-link-pill">
          <LinkIcon size={11} /> {note.link || "no verse link"}
        </span>
        {note.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        <span style={{ marginLeft: "auto" }}>Edited {note.editedRelative} · auto-saved</span>
      </div>

      <div className="note-body">
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
          placeholder="Begin from a verse, a question, or a feeling. There is no wrong place to start."
        />
        {showPreview ? (
          <div className="note-body-preview" aria-hidden>
            {renderMarkdown(body)}
          </div>
        ) : null}
        {/* Hidden mirror used to compute caret pixel coordinates. */}
        <div ref={mirrorRef} className="note-body-mirror" aria-hidden />
      </div>

      <SlashMenu
        anchor={slash ? slash.anchor : null}
        open={slash !== null}
        query={slash?.query ?? ""}
        onSelect={handleSlashSelect}
        onClose={closeSlash}
      />

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
 * Compute the viewport-fixed caret coordinates for a textarea. We do this
 * by mirroring the textarea's contents up to the caret in a hidden div,
 * matching font/padding/width via CSS, then reading the rect of a marker
 * span. Standard technique — works without contenteditable.
 */
function caretCoordsFromTextarea(
  textarea: HTMLTextAreaElement | null,
  mirror: HTMLDivElement | null,
  caret: number,
): { x: number; y: number } {
  if (!textarea || !mirror) {
    return { x: 0, y: 0 };
  }
  const style = window.getComputedStyle(textarea);
  const props: readonly string[] = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderStyle",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "whiteSpace",
    "wordWrap",
  ];
  // Position offscreen but measurable.
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  for (const prop of props) {
    const value = style.getPropertyValue(camelToKebab(prop));
    mirror.style.setProperty(camelToKebab(prop), value);
  }

  const text = textarea.value.substring(0, caret);
  mirror.textContent = text;
  const marker = document.createElement("span");
  marker.textContent = textarea.value.substring(caret) || ".";
  mirror.appendChild(marker);

  const taRect = textarea.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  const x = taRect.left + (markerRect.left - mirrorRect.left) - textarea.scrollLeft;
  const y = taRect.top + (markerRect.top - mirrorRect.top) - textarea.scrollTop + markerRect.height;

  return { x, y };
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
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
