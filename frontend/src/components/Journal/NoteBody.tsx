"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from "react";

import { LinkIcon, SparkleIcon } from "@/components/Icon";
import { SlashMenu } from "@/components/SlashMenu/SlashMenu";
import { TemplatePicker } from "@/components/TemplatePicker/TemplatePicker";
import { useSlashMenuInternal } from "@/hooks/useSlashMenu";
import { renderMarkdown } from "@/lib/markdown";
import { runSlashCommand } from "@/lib/slash-commands";
import type { Note, SlashCommand, SlashCommandResult, Template } from "@/types";

type Props = {
  note: Note;
  /** Persists body changes back to the user-notes store. The `aiAssisted`
   * flag flips true after any AI-generating slash command resolves. */
  onChangeBody?: (body: string, opts: { aiAssisted?: boolean }) => void;
};

// Loading placeholder — we replace this with the actual result content once
// the mock async runner resolves. Kept short so it doesn't visually dominate
// the document while the user is reading.
const LOADING_TOKEN = "[loading…]";

export function NoteBody({ note, onChangeBody }: Props) {
  const editorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [body, setBody] = useState<string>(note.body);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  // Tracks where to insert the template's sections when the picker resolves.
  // Set when the user runs `/template` from inline; cleared when the picker
  // closes without selection.
  const [templateInsertionAt, setTemplateInsertionAt] = useState<number | null>(null);

  const slash = useSlashMenuInternal(textareaRef);

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
    slash.onTextChange(next, event.target.selectionStart ?? next.length);
  }

  function handleSelectionChange(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
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
      </div>

      <SlashMenu
        anchor={slash.anchor}
        open={slash.open}
        query={slash.query}
        onSelect={handleSlashSelect}
        onClose={slash.close}
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
