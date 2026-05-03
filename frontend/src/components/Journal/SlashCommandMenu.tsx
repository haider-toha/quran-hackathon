"use client";

// SlashCommandMenu — the journal editor's slash-command menu.
//
// Detects a `/` typed at the start of a line (or after whitespace) inside
// the editor textarea, then renders a small floating menu with five
// curated options: Heading, Quote, Verse reference, Divider, Tafsir
// citation. The two specialty options (Verse reference, Tafsir citation)
// pop an inline mini-picker for the additional argument needed.
//
// Caret positioning uses a hidden-mirror technique: a div mirrors the
// textarea's font/padding/width, we render the text up to the caret, and
// the trailing span's rect gives us the caret's pixel coordinates. The
// menu is portaled to the body so ancestor `overflow:hidden` doesn't clip
// it.
//
// Hosting contract:
//   - NoteBody passes `body` (current value) and `textareaRef`.
//   - When the user picks an option, we call `onApply` with an edit shape
//     identical to FloatingSelectionToolbar's so the host has a single
//     edit-application code path.
//   - We DO NOT mutate the textarea directly — all writes flow through the
//     controlled-component onChange in NoteBody.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import {
  AlignLeftIcon,
  Heading2Icon,
  InsertIcon,
  QuoteIcon,
  SourceIcon,
  type IconProps,
} from "@/components/Icon";
import { findSurah, TAFSIR_SOURCES } from "@/lib/mock-data";

export type SlashApplyEdit = {
  /** Inclusive start offset of the range to replace. */
  start: number;
  /** Exclusive end offset of the range to replace. */
  end: number;
  /** Replacement text. */
  replacement: string;
  /** New selection start to apply (relative to the NEW body). */
  newSelectionStart: number;
  /** New selection end to apply (relative to the NEW body). */
  newSelectionEnd: number;
};

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  body: string;
  /** Apply the edit to the body and persist via the parent's onChangeBody. */
  onApply: (edit: SlashApplyEdit) => void;
};

type Coord = {
  x: number;
  y: number;
};

type SlashContext = {
  /** Index of the leading `/` in the body. */
  start: number;
  /** Caret position when the slash was last evaluated. */
  caret: number;
  /** Filter text typed after the `/`. */
  query: string;
  /** Caret-anchored fixed coordinates. */
  anchor: Coord;
};

// Stable command catalog — the spec lists five options; ids drive the
// activation flow without leaning on i18n-prone display strings.
type CommandId = "heading" | "quote" | "verse" | "divider" | "tafsir";

type Command = {
  id: CommandId;
  label: string;
  description: string;
  /** What we type to filter — also matched against the typed query. */
  trigger: string;
  icon: (props: IconProps) => ReactNode;
};

const COMMANDS: readonly Command[] = [
  {
    id: "heading",
    label: "Heading",
    description: "Insert ## section heading",
    trigger: "heading",
    icon: Heading2Icon,
  },
  {
    id: "quote",
    label: "Quote",
    description: "Start a blockquote",
    trigger: "quote",
    icon: QuoteIcon,
  },
  {
    id: "verse",
    label: "Verse reference",
    description: "Cite a verse from the Quran",
    trigger: "verse",
    icon: InsertIcon,
  },
  {
    id: "divider",
    label: "Divider",
    description: "Insert a horizontal rule",
    trigger: "divider",
    icon: AlignLeftIcon,
  },
  {
    id: "tafsir",
    label: "Tafsir citation",
    description: "Quote tafsir on a verse",
    trigger: "tafsir",
    icon: SourceIcon,
  },
];

const VERSE_REF_RE = /^(\d+):(\d+)(?:-(\d+))?$/u;

export function SlashCommandMenu({ textareaRef, body, onApply }: Props) {
  const [slash, setSlash] = useState<SlashContext | null>(null);
  // Active sub-mode for commands that need an argument. `null` means the
  // root menu is showing.
  const [submode, setSubmode] = useState<"verse" | "tafsir" | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const mirrorRef = useRef<HTMLDivElement | null>(null);

  // Spin up a hidden mirror for caret measurements.
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

  // Filter the catalog by the query in the active context. Empty query
  // shows everything.
  const matches = useMemo<readonly Command[]>(() => {
    const q = (slash?.query ?? "").toLowerCase();
    if (q.length === 0) return COMMANDS;
    return COMMANDS.filter((cmd) => {
      return cmd.trigger.toLowerCase().includes(q) || cmd.label.toLowerCase().includes(q);
    });
  }, [slash?.query]);

  // Clamp the highlight to the visible matches range at render so it
  // never points at a stale entry. Pure-derived from state — avoids the
  // setState-in-effect anti-pattern.
  const safeActiveIndex = matches.length === 0 ? 0 : Math.min(activeIndex, matches.length - 1);

  const close = useCallback(() => {
    setSlash(null);
    setSubmode(null);
  }, []);

  // Detect-and-update the slash context based on the current body + caret.
  // Trigger rule: `/` at start-of-line or after whitespace, with no
  // whitespace between the slash and caret.
  const detect = useCallback(
    (text: string, caret: number) => {
      let i = caret - 1;
      let queryStart = -1;
      while (i >= 0) {
        const ch = text[i];
        if (ch === undefined) break;
        if (/\s/u.test(ch)) break;
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
        setSubmode(null);
        return;
      }
      const query = text.slice(queryStart + 1, caret);
      // Hard cap on query length — runaway captures would otherwise keep
      // the menu mounted as the user types a long word.
      if (query.length > 32) {
        setSlash(null);
        setSubmode(null);
        return;
      }
      const ta = textareaRef.current;
      const mirror = mirrorRef.current;
      if (!ta || !mirror) {
        setSlash({ start: queryStart, caret, query, anchor: { x: 0, y: 0 } });
        return;
      }
      const anchor = caretCoords(ta, mirror, caret);
      setSlash((prev) => {
        const next: SlashContext = { start: queryStart, caret, query, anchor };
        if (
          prev &&
          prev.start === next.start &&
          prev.caret === next.caret &&
          prev.query === next.query &&
          prev.anchor.x === next.anchor.x &&
          prev.anchor.y === next.anchor.y
        ) {
          return prev;
        }
        return next;
      });
    },
    [textareaRef],
  );

  // Listen for textarea selection/input events so the menu opens as soon as
  // the user types `/`. We intentionally listen at the document level for
  // selectionchange — it fires reliably for keyboard-driven movement that
  // `select` misses. Other events stay on the textarea.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return undefined;
    function onUpdate() {
      const ta = textareaRef.current;
      if (!ta) return;
      detect(ta.value, ta.selectionStart ?? ta.value.length);
    }
    function onBlur() {
      // Defer one tick so a click on the menu (which steals focus only
      // briefly via prevented mousedown) doesn't close us. When focus
      // lands inside the slash menu (e.g. a sub-mode picker input), keep
      // the menu open — the user is still completing the command.
      window.setTimeout(() => {
        if (document.activeElement === ta) return;
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.closest(".slash-menu")) return;
        close();
      }, 0);
    }
    ta.addEventListener("input", onUpdate);
    ta.addEventListener("click", onUpdate);
    ta.addEventListener("keyup", onUpdate);
    ta.addEventListener("blur", onBlur);
    return () => {
      ta.removeEventListener("input", onUpdate);
      ta.removeEventListener("click", onUpdate);
      ta.removeEventListener("keyup", onUpdate);
      ta.removeEventListener("blur", onBlur);
    };
  }, [detect, close, textareaRef]);

  // Build the edit for the active command. The slash itself is replaced
  // along with whatever the user has typed since (the filter chars).
  const buildEdit = useCallback(
    (replacement: string, selectionOffset?: { start: number; end: number }): SlashApplyEdit => {
      if (!slash) {
        return {
          start: 0,
          end: 0,
          replacement,
          newSelectionStart: replacement.length,
          newSelectionEnd: replacement.length,
        };
      }
      const start = slash.start;
      const end = slash.caret;
      const insertedEnd = start + replacement.length;
      return {
        start,
        end,
        replacement,
        newSelectionStart: selectionOffset ? start + selectionOffset.start : insertedEnd,
        newSelectionEnd: selectionOffset ? start + selectionOffset.end : insertedEnd,
      };
    },
    [slash],
  );

  const handleSelect = useCallback(
    (cmd: Command) => {
      if (!slash) return;
      switch (cmd.id) {
        case "heading":
          onApply(buildEdit("## "));
          close();
          return;
        case "quote":
          onApply(buildEdit("> "));
          close();
          return;
        case "divider":
          onApply(buildEdit("\n---\n"));
          close();
          return;
        case "verse":
          // Drop into the verse-ref mini-picker. We strip the typed slash
          // so the picker reads against an empty line.
          onApply(buildEdit(""));
          setSubmode("verse");
          return;
        case "tafsir":
          onApply(buildEdit(""));
          setSubmode("tafsir");
          return;
        default:
          return;
      }
    },
    [slash, onApply, buildEdit, close],
  );

  const handleVerseSubmit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      const insertion = formatVerseCitation(trimmed);
      onApply({
        start: textareaRef.current?.selectionStart ?? 0,
        end: textareaRef.current?.selectionStart ?? 0,
        replacement: insertion,
        newSelectionStart: (textareaRef.current?.selectionStart ?? 0) + insertion.length,
        newSelectionEnd: (textareaRef.current?.selectionStart ?? 0) + insertion.length,
      });
      close();
    },
    [onApply, textareaRef, close],
  );

  const handleTafsirSubmit = useCallback(
    (sourceName: string, ref: string) => {
      const insertion = formatTafsirCitation(sourceName, ref.trim());
      onApply({
        start: textareaRef.current?.selectionStart ?? 0,
        end: textareaRef.current?.selectionStart ?? 0,
        replacement: insertion,
        newSelectionStart: (textareaRef.current?.selectionStart ?? 0) + insertion.length,
        newSelectionEnd: (textareaRef.current?.selectionStart ?? 0) + insertion.length,
      });
      close();
    },
    [onApply, textareaRef, close],
  );

  // Keyboard nav — Arrow up/down moves the highlight; Enter selects; Escape
  // closes (and removes the typed slash + filter chars per spec).
  useEffect(() => {
    if (!slash || submode !== null) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((idx) => (matches.length === 0 ? 0 : (idx + 1) % matches.length));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((idx) =>
          matches.length === 0 ? 0 : (idx - 1 + matches.length) % matches.length,
        );
      } else if (event.key === "Enter") {
        const cmd = matches[safeActiveIndex];
        if (cmd) {
          event.preventDefault();
          handleSelect(cmd);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        // Per spec: Esc removes the typed `/` plus filter chars.
        if (slash) {
          onApply(buildEdit(""));
        }
        close();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [slash, submode, matches, safeActiveIndex, handleSelect, onApply, buildEdit, close]);

  if (typeof document === "undefined") return null;
  if (!slash) return null;
  // When the typed filter no longer matches any command, render nothing
  // so the user can keep typing freely. Backspacing back into a matching
  // query re-shows the menu without re-arming any state.
  if (submode === null && matches.length === 0) return null;

  // Position the menu just below the caret. Clamp to the viewport so the
  // menu never spills off the right edge.
  const left = clamp(
    slash.anchor.x,
    12,
    (typeof window !== "undefined" ? window.innerWidth : 9999) - 252,
  );

  return createPortal(
    <div
      className="slash-menu"
      role="menu"
      aria-label="Slash commands"
      style={{
        position: "fixed",
        left,
        top: slash.anchor.y + 6,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {submode === "verse" ? (
        <VerseRefPicker onSubmit={handleVerseSubmit} onCancel={close} />
      ) : submode === "tafsir" ? (
        <TafsirCitationPicker onSubmit={handleTafsirSubmit} onCancel={close} />
      ) : (
        <ul className="slash-list">
          {matches.length === 0 ? (
            <li className="slash-empty">No commands</li>
          ) : (
            matches.map((cmd, index) => {
              const Icon = cmd.icon;
              const selected = index === safeActiveIndex;
              return (
                <li key={cmd.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={`slash-row${selected ? "is-active" : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(cmd)}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <span className="slash-icon">
                      <Icon size={13} />
                    </span>
                    <span className="slash-text">
                      <span className="slash-name">{cmd.label}</span>
                      <span className="slash-desc">{cmd.description}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>,
    document.body,
  );

  // The unused `body` parameter is here for future contextual filtering
  // (e.g. "don't show heading inside a blockquote"). Quiet the linter
  // by referencing it.
  void body;
}

type VerseRefPickerProps = {
  onSubmit: (raw: string) => void;
  onCancel: () => void;
};

function VerseRefPicker({ onSubmit, onCancel }: VerseRefPickerProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <div className="slash-picker">
      <span className="slash-picker-label">Verse</span>
      <input
        ref={inputRef}
        type="text"
        className="slash-picker-input"
        placeholder="93:3"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (value.trim().length === 0) onCancel();
            else onSubmit(value);
          } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        aria-label="Verse reference"
      />
    </div>
  );
}

type TafsirCitationPickerProps = {
  onSubmit: (sourceName: string, ref: string) => void;
  onCancel: () => void;
};

const TAFSIR_PICK_SOURCES = ["Tafsir As-Sadi", "Tafsir Ibn Kathir", "Tafsir al-Qurtubi"] as const;

function TafsirCitationPicker({ onSubmit, onCancel }: TafsirCitationPickerProps) {
  const [source, setSource] = useState<string>(TAFSIR_PICK_SOURCES[0]);
  const [ref, setRef] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Allow source to be picked from the canonical list — defaulting to the
  // first one means a single-Enter flow works for the common case.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <div className="slash-picker">
      <span className="slash-picker-label">Tafsir</span>
      <select
        className="slash-picker-select"
        value={source}
        onChange={(event) => setSource(event.target.value)}
        aria-label="Tafsir source"
      >
        {TAFSIR_PICK_SOURCES.map((name) => {
          // Try to match a full source record; fall back to the bare name.
          const record = TAFSIR_SOURCES.find((s) => s.name === name);
          return (
            <option key={record?.id ?? name} value={name}>
              {name}
            </option>
          );
        })}
      </select>
      <input
        ref={inputRef}
        type="text"
        className="slash-picker-input"
        placeholder="93:3"
        value={ref}
        onChange={(event) => setRef(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (ref.trim().length === 0) onCancel();
            else onSubmit(source, ref);
          } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        aria-label="Verse reference"
      />
    </div>
  );
}

function formatVerseCitation(raw: string): string {
  const match = VERSE_REF_RE.exec(raw);
  if (!match) {
    return `> [verse: ${raw}]\n`;
  }
  const surahNum = Number(match[1]);
  const ayahFrom = Number(match[2]);
  const surah = findSurah(surahNum);
  if (!surah) return `> [verse: ${raw}]\n`;
  const verse = surah.verses.find((v) => v.number === ayahFrom);
  if (!verse) return `> [verse: ${raw}]\n`;
  return `> ${verse.arabic}\n> — ${surah.transliteration}, ${surahNum}:${ayahFrom}\n`;
}

function formatTafsirCitation(sourceName: string, ref: string): string {
  const trimmedRef = ref.length > 0 ? ref : "—";
  return `## ${sourceName} on ${trimmedRef}\n\n> ...\n`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function caretCoords(textarea: HTMLTextAreaElement, mirror: HTMLDivElement, caret: number): Coord {
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
  mirror.textContent = textarea.value.substring(0, caret);
  const marker = document.createElement("span");
  // Single-character marker so `markerRect.height` is one line, not the
  // full height of all post-caret text. The marker just needs SOMETHING
  // rendered so its rect captures the caret-line position.
  marker.textContent = ".";
  mirror.appendChild(marker);
  const taRect = textarea.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  const x = taRect.left + (markerRect.left - mirrorRect.left) - textarea.scrollLeft;
  const y = taRect.top + (markerRect.top - mirrorRect.top) - textarea.scrollTop + markerRect.height;
  marker.remove();
  return { x, y };
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
