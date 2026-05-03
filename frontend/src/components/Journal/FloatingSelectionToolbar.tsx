"use client";

// FloatingSelectionToolbar — appears above the user's current text selection
// inside the V2 note editor. Buttons mutate the textarea body via a parent-
// supplied callback so the editor's controlled-component flow stays the
// single source of truth (no direct DOM writes that would diverge from
// React state).
//
// Position is computed from the textarea + a hidden mirror div: we render
// the text up to `selectionStart` in the mirror, append a marker span, then
// read the marker's bounding rect. Same technique the slash menu uses for
// caret coords; here we use it for the SELECTION midpoint so the toolbar
// centers above the highlighted span.
//
// Cite-verse opens an inline picker (no portal) with a tiny input where the
// user pastes a `surah:ayah` reference. On submit we look up the verse from
// AD_DUHA mock data and insert a citation block, falling back to a
// placeholder line when the reference can't be resolved.

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

import { BoldIcon, InsertIcon, ItalicIcon, LinkIcon, QuoteIcon } from "@/components/Icon";
import { findSurah } from "@/lib/mock-data";

export type SelectionEdit = {
  /** Inclusive start offset of the range to replace. */
  start: number;
  /** Exclusive end offset of the range to replace. */
  end: number;
  /** Replacement text. */
  replacement: string;
  /** Selection start to apply after the replacement (relative to NEW body). */
  newSelectionStart: number;
  /** Selection end to apply after the replacement (relative to NEW body). */
  newSelectionEnd: number;
};

export type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  body: string;
  /** Apply the edit to the body and persist via the parent's onChangeBody. */
  onApply: (edit: SelectionEdit) => void;
};

type Range = {
  start: number;
  end: number;
};

type Coord = {
  x: number;
  y: number;
};

const VERSE_REF_RE = /^(\d+):(\d+)(?:-(\d+))?$/u;

export function FloatingSelectionToolbar({ textareaRef, body, onApply }: Props) {
  const [range, setRange] = useState<Range | null>(null);
  const [anchor, setAnchor] = useState<Coord | null>(null);
  // Cite-picker is a sub-state of the toolbar — only meaningful while the
  // toolbar itself is visible.
  const [citePickerOpen, setCitePickerOpen] = useState(false);

  const mirrorRef = useRef<HTMLDivElement | null>(null);

  // Spin up a single hidden mirror div for the lifetime of the component.
  // Reused across recomputes; cleaned up on unmount.
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const mirror = document.createElement("div");
    mirror.setAttribute("aria-hidden", "true");
    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.top = "0";
    mirror.style.left = "-9999px";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";
    document.body.appendChild(mirror);
    mirrorRef.current = mirror;
    return () => {
      mirror.remove();
      if (mirrorRef.current === mirror) mirrorRef.current = null;
    };
  }, []);

  const recompute = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setRange(null);
      setAnchor(null);
      return;
    }
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    if (end <= start) {
      setRange(null);
      setAnchor(null);
      setCitePickerOpen(false);
      return;
    }
    const mirror = mirrorRef.current;
    if (!mirror) {
      setRange({ start, end });
      setAnchor(null);
      return;
    }
    const coord = selectionMidCoords(textarea, mirror, start, end);
    setRange({ start, end });
    setAnchor(coord);
  }, [textareaRef]);

  // Track selection across textarea, focus changes, scroll, and window
  // resize. Listening on document `selectionchange` is the most reliable
  // way to catch keyboard-driven selection (Shift+Arrow) which doesn't
  // dispatch `select` until the next interaction.
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    function onSelectionChange() {
      const ta = textareaRef.current;
      if (!ta) return;
      // Only react when the textarea is the active element — otherwise
      // the user is selecting elsewhere.
      if (document.activeElement !== ta) {
        setRange(null);
        setAnchor(null);
        setCitePickerOpen(false);
        return;
      }
      recompute();
    }
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [recompute, textareaRef]);

  // Scroll inside the textarea (or any ancestor) shifts the rendered
  // selection rect. Re-measure on scroll and resize so the toolbar tracks.
  useEffect(() => {
    if (range === null) return undefined;
    function onChange() {
      recompute();
    }
    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [range, recompute]);

  // Hide the toolbar (and any open cite picker) when the textarea blurs.
  // Selection survives blur in many browsers, but the toolbar shouldn't.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return undefined;
    function onBlur() {
      setRange(null);
      setAnchor(null);
      setCitePickerOpen(false);
    }
    ta.addEventListener("blur", onBlur);
    return () => ta.removeEventListener("blur", onBlur);
  }, [textareaRef]);

  // Apply a wrap-around edit: replaces [start, end) with `before + selected + after`
  // and positions the new selection inside the wrapper so the user can keep typing.
  const applyWrap = useCallback(
    (before: string, after: string) => {
      if (!range) return;
      const selected = body.slice(range.start, range.end);
      const replacement = `${before}${selected}${after}`;
      onApply({
        start: range.start,
        end: range.end,
        replacement,
        newSelectionStart: range.start + before.length,
        newSelectionEnd: range.start + before.length + selected.length,
      });
    },
    [body, range, onApply],
  );

  // Apply a multi-line prefix edit (e.g. "> " for blockquote): walks the
  // selection, prefixing every line. If the selection spans only part of a
  // line we still treat the whole line as quoted — matches markdown's
  // line-oriented model.
  const applyLinePrefix = useCallback(
    (prefix: string) => {
      if (!range) return;
      // Expand range to whole lines so prefixes land on line starts.
      const lineStart = body.lastIndexOf("\n", range.start - 1) + 1;
      const trailingNl = body.indexOf("\n", range.end);
      const lineEnd = trailingNl === -1 ? body.length : trailingNl;
      const block = body.slice(lineStart, lineEnd);
      const replacement = block
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");
      // Adjust new selection so the user keeps the same selection contents,
      // just shifted by the cumulative prefix length.
      const linesBeforeStart = body.slice(lineStart, range.start).split("\n").length - 1;
      const linesBeforeEnd = body.slice(lineStart, range.end).split("\n").length - 1;
      const startShift = (linesBeforeStart + 1) * prefix.length;
      const endShift = (linesBeforeEnd + 1) * prefix.length;
      onApply({
        start: lineStart,
        end: lineEnd,
        replacement,
        newSelectionStart: lineStart + (range.start - lineStart) + startShift - prefix.length,
        newSelectionEnd: lineStart + (range.end - lineStart) + endShift - prefix.length,
      });
    },
    [body, range, onApply],
  );

  const handleBold = useCallback(() => applyWrap("**", "**"), [applyWrap]);
  const handleItalic = useCallback(() => applyWrap("*", "*"), [applyWrap]);
  const handleQuote = useCallback(() => applyLinePrefix("> "), [applyLinePrefix]);

  const handleLink = useCallback(() => {
    if (!range) return;
    const selected = body.slice(range.start, range.end);
    const linkText = selected.length > 0 ? selected : "text";
    const replacement = `[${linkText}](url)`;
    // Caret lands inside the empty url parens so the user can type the URL
    // immediately. Keep it simple — no auto-prompt.
    const urlOffset = replacement.indexOf("(") + 1;
    const newStart = range.start + urlOffset;
    onApply({
      start: range.start,
      end: range.end,
      replacement,
      newSelectionStart: newStart,
      newSelectionEnd: newStart + 3, // selects "url" placeholder
    });
  }, [body, range, onApply]);

  const handleCiteVerseInsert = useCallback(
    (raw: string) => {
      if (!range) return;
      const trimmed = raw.trim();
      const match = VERSE_REF_RE.exec(trimmed);
      const insertion = formatVerseCitation(trimmed, match);
      // Replace the selected text with the citation block; the toolbar is
      // only visible when there's a selection, so [start, end) is non-empty.
      onApply({
        start: range.start,
        end: range.end,
        replacement: insertion,
        newSelectionStart: range.start + insertion.length,
        newSelectionEnd: range.start + insertion.length,
      });
      setCitePickerOpen(false);
    },
    [range, onApply],
  );

  // Render nothing when there's no selection or anchor yet computed.
  if (!range || !anchor) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="floating-selection-toolbar"
      role="toolbar"
      aria-label="Format selection"
      style={{
        position: "fixed",
        left: anchor.x,
        top: anchor.y,
        transform: "translate(-50%, calc(-100% - 8px))",
      }}
      // Block the toolbar from stealing selection on mousedown. Without
      // this, clicking a button collapses the selection before onClick
      // fires, breaking every command.
      onMouseDown={(event) => event.preventDefault()}
    >
      <ToolbarButton label="Bold" onClick={handleBold}>
        <BoldIcon size={13} />
      </ToolbarButton>
      <ToolbarButton label="Italic" onClick={handleItalic}>
        <ItalicIcon size={13} />
      </ToolbarButton>
      <ToolbarButton label="Quote" onClick={handleQuote}>
        <QuoteIcon size={13} />
      </ToolbarButton>
      <ToolbarButton label="Link" onClick={handleLink}>
        <LinkIcon size={13} />
      </ToolbarButton>
      <ToolbarButton label="Cite verse" onClick={() => setCitePickerOpen((v) => !v)}>
        <InsertIcon size={13} />
      </ToolbarButton>
      {citePickerOpen ? (
        <CiteVersePicker
          onSubmit={handleCiteVerseInsert}
          onCancel={() => setCitePickerOpen(false)}
        />
      ) : null}
    </div>,
    document.body,
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="floating-selection-btn"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
    >
      {children}
    </button>
  );
}

type CitePickerProps = {
  onSubmit: (raw: string) => void;
  onCancel: () => void;
};

function CiteVersePicker({ onSubmit, onCancel }: CitePickerProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus on mount. The toolbar's mousedown.preventDefault stops the
  // editor from re-grabbing focus, so the input is focusable here.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(() => {
    if (value.trim().length === 0) {
      onCancel();
      return;
    }
    onSubmit(value);
  }, [onSubmit, onCancel, value]);

  return (
    <div className="floating-selection-picker">
      <input
        ref={inputRef}
        className="floating-selection-input"
        type="text"
        placeholder="93:3"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        aria-label="Verse reference"
      />
      <button type="button" className="floating-selection-confirm" onClick={submit}>
        Insert
      </button>
    </div>
  );
}

/** Format a verse citation block. Falls back to a placeholder when the
 * reference can't be resolved (unknown surah, malformed input). */
function formatVerseCitation(raw: string, match: RegExpExecArray | null): string {
  if (!match) {
    return `> [verse: ${raw}]\n`;
  }
  const surahNum = Number(match[1]);
  const ayahFrom = Number(match[2]);
  const surah = findSurah(surahNum);
  if (!surah) {
    return `> [verse: ${raw}]\n`;
  }
  const verse = surah.verses.find((v) => v.number === ayahFrom);
  if (!verse) {
    return `> [verse: ${raw}]\n`;
  }
  return `> ${verse.arabic}\n> — ${surah.transliteration}, ${surahNum}:${ayahFrom}\n`;
}

/**
 * Compute the viewport-fixed pixel coords for the MIDPOINT of [start, end)
 * inside a textarea. We mirror the textarea's text up to `start`, then
 * insert a span containing the selection text — the span's bounding rect
 * gives us the selection's rendered box. Center of that box is what we
 * place the toolbar above.
 */
function selectionMidCoords(
  textarea: HTMLTextAreaElement,
  mirror: HTMLDivElement,
  start: number,
  end: number,
): Coord {
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
  for (const prop of props) {
    const kebab = camelToKebab(prop);
    const value = style.getPropertyValue(kebab);
    mirror.style.setProperty(kebab, value);
  }

  // Empty mirror, then push the leading text and a marker span containing
  // the selection. The marker rect is the selection's rendered footprint.
  mirror.textContent = textarea.value.substring(0, start);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.substring(start, end) || ".";
  mirror.appendChild(marker);

  const taRect = textarea.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  const x =
    taRect.left + (markerRect.left - mirrorRect.left) - textarea.scrollLeft + markerRect.width / 2;
  const y = taRect.top + (markerRect.top - mirrorRect.top) - textarea.scrollTop;

  marker.remove();

  return { x, y };
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
