"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Maximum length of a slash query before we close the menu — guards against
// runaway captures (long words after a slash that shouldn't trigger the
// inline command UI).
const MAX_QUERY_LENGTH = 32;

export type SlashMenuState = {
  /** Whether the menu should be visible. */
  open: boolean;
  /** Latest typed query (everything between "/" and current caret). */
  query: string;
  /** Bounding rect of the caret-anchored virtual element, or null when closed. */
  anchorRect: DOMRect | null;
  /**
   * Inspect the host editor's current text + caret, decide whether the slash
   * menu should be open, and (if so) update the query + anchor. Call from the
   * editor's `onChange` / `onSelect` / `onClick` handlers.
   */
  onTextChange: (text: string, caret: number) => void;
  /** Force-close the menu (e.g. after a command runs). */
  close: () => void;
};

/**
 * Internal slash-menu surface used by NoteBody. Exposes the start offset of
 * the leading slash so the host can replace the typed command in-place when
 * a selection resolves, plus the raw caret coordinate for SlashMenu's
 * virtual anchor mode.
 */
export type SlashMenuStateInternal = SlashMenuState & {
  /** Index in body where the leading "/" sits, or null when closed. */
  startOffset: number | null;
  /** Caret-anchored coordinates (passes through to SlashMenu's virtual anchor). */
  anchor: { x: number; y: number } | null;
};

type SlashContext = {
  /** Caret coordinate for the floating menu virtual anchor. */
  anchor: { x: number; y: number };
  /** Index in body where the leading "/" sits. */
  startOffset: number;
  /** Latest typed query (everything between "/" and current caret). */
  query: string;
};

/**
 * Detect-and-track state for a `/`-prefixed inline command menu inside a
 * textarea. Mirrors the host textarea's text into a hidden div so we can
 * compute pixel coordinates for the caret without relying on
 * `contenteditable`. The host component is responsible for rendering the
 * floating menu UI itself — this hook only reports when/where it should be.
 *
 * Trigger rules: a `/` at start-of-line OR after whitespace, with no
 * whitespace between the `/` and the caret. Closes when the query exceeds
 * `MAX_QUERY_LENGTH` characters or when no slash sits before the caret.
 */
export function useSlashMenu<E extends HTMLElement>(ref: RefObject<E | null>): SlashMenuState {
  const internal = useSlashMenuInternal(ref);
  const { open, query, anchorRect, onTextChange, close } = internal;
  return { open, query, anchorRect, onTextChange, close };
}

/**
 * Internal variant exposing the slash-menu start offset and raw caret
 * coordinate alongside the standard `SlashMenuState`. NoteBody uses this to
 * splice the user's typed command in-place when they pick from the menu.
 */
export function useSlashMenuInternal<E extends HTMLElement>(
  ref: RefObject<E | null>,
): SlashMenuStateInternal {
  const [slash, setSlash] = useState<SlashContext | null>(null);
  // Mirror element used to compute caret pixel coordinates. Lives for the
  // lifetime of the hook; reused across measurements.
  const mirrorRef = useRef<HTMLDivElement | null>(null);

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

  const close = useCallback(() => {
    setSlash(null);
  }, []);

  const onTextChange = useCallback(
    (text: string, caret: number) => {
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
      if (rawQuery.length > MAX_QUERY_LENGTH) {
        setSlash(null);
        return;
      }

      const anchor = caretCoordsFromTextarea(
        // Hosts pass either an HTMLTextAreaElement or HTMLInputElement; we
        // only support textareas in this v3 surface so a runtime guard
        // would be redundant. Cast through the shared HTMLElement bound.
        ref.current instanceof HTMLTextAreaElement ? ref.current : null,
        mirrorRef.current,
        caret,
      );
      setSlash({ anchor, startOffset: queryStart, query: rawQuery });
    },
    [ref],
  );

  const anchorRect: DOMRect | null = slash
    ? new DOMRect(slash.anchor.x, slash.anchor.y, 1, 1)
    : null;

  return {
    open: slash !== null,
    query: slash?.query ?? "",
    anchorRect,
    onTextChange,
    close,
    startOffset: slash?.startOffset ?? null,
    anchor: slash?.anchor ?? null,
  };
}

/**
 * Compute the viewport-fixed caret coordinates for a textarea. We mirror the
 * textarea's contents up to the caret in a hidden div, match font/padding/
 * width via CSS, then read the rect of a marker span. Standard technique —
 * works without contenteditable.
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
  for (const prop of props) {
    const kebab = camelToKebab(prop);
    const value = style.getPropertyValue(kebab);
    mirror.style.setProperty(kebab, value);
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

  // Detach the marker so the next measurement starts clean.
  marker.remove();

  return { x, y };
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
