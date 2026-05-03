"use client";

// SlashMenu — an inline floating menu activated when the user types `/` in
// a textarea or contenteditable. Filters the SLASH_COMMANDS registry by
// the current query and an optional whitelist (`allowedIds`).
//
// Positioning: when `anchor` is an HTMLElement, FloatingCard handles it.
// When `anchor` is a coordinate, we render a 1x1 invisible "virtual anchor"
// fixed at that position and pass it to FloatingCard. The virtual anchor
// itself is portaled into the body so it always lives in the viewport
// frame regardless of any ancestor `overflow:hidden`.
//
// ARIA: rendered as `role="menu"` with `role="menuitem"` rows. The textarea
// upstream stays in its native role; consumers should not advertise the
// menu via `aria-controls` because the menu doesn't trap focus and hangs
// off a transient slash trigger rather than a stable popup button.

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FloatingCard } from "@/components/FloatingCard";
import { ICON_MAP } from "@/components/Icon";
import { useRovingFocus } from "@/hooks/useRovingFocus";
import { SLASH_COMMANDS } from "@/lib/slash-commands";
import type { SlashCommand } from "@/types";

type SlashAnchor = { x: number; y: number } | HTMLElement | null;

export type SlashMenuProps = {
  anchor: SlashAnchor;
  open: boolean;
  /** Text typed after the slash. Empty string means "show everything". */
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  /** Whitelist of command ids — useful where only a subset is meaningful. */
  allowedIds?: readonly string[];
};

function isCoord(a: SlashAnchor): a is { x: number; y: number } {
  return a !== null && typeof a === "object" && !(a instanceof HTMLElement);
}

function filterCommands(
  query: string,
  allowedIds: readonly string[] | undefined,
): readonly SlashCommand[] {
  const q = query.toLowerCase();
  const slashed = `/${q}`;
  return SLASH_COMMANDS.filter((cmd) => {
    if (allowedIds && !allowedIds.includes(cmd.id)) return false;
    if (q.length === 0) return true;
    // Match if the trigger contains "/<query>" (e.g. "/se" matches "/search")
    // or the human name includes the query (case-insensitive).
    return (
      cmd.trigger.includes(slashed) ||
      `/${cmd.trigger}`.includes(slashed) ||
      cmd.name.toLowerCase().includes(q)
    );
  });
}

/**
 * Virtual 1x1 anchor portaled to the body at fixed coordinates. Used when
 * the consumer passes raw {x, y} (the caret position, typically). Returning
 * a stable element reference each time keeps FloatingCard from thrashing.
 */
function VirtualAnchor({
  x,
  y,
  onMount,
}: {
  x: number;
  y: number;
  onMount: (el: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Re-report the element when the position changes; FloatingCard's anchor
  // tracking re-reads `getBoundingClientRect()` each frame anyway, but this
  // ensures the reference is current.
  useEffect(() => {
    onMount(ref.current);
    return () => onMount(null);
  }, [onMount]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        top: y,
        left: x,
        width: 1,
        height: 1,
        pointerEvents: "none",
      }}
    />,
    document.body,
  );
}

export function SlashMenu({ anchor, open, query, onSelect, onClose, allowedIds }: SlashMenuProps) {
  const [virtualEl, setVirtualEl] = useState<HTMLDivElement | null>(null);

  const matches = useMemo(() => filterCommands(query, allowedIds), [query, allowedIds]);
  const { activeIndex, setActiveIndex, onKeyDown: onRovingKeyDown } = useRovingFocus(
    matches.length,
    query,
    { enabled: open },
  );

  // Auto-close when the filter empties — gives the consuming editor a clean
  // signal that further typing should fall through to the textarea.
  useEffect(() => {
    if (open && matches.length === 0) {
      onClose();
    }
  }, [open, matches.length, onClose]);

  // Keyboard: roving focus claims ArrowUp/Down/Home/End; Enter selects;
  // Escape closes. We listen on the document because focus typically lives
  // in the textarea above us, not inside this menu.
  useEffect(() => {
    if (!open || matches.length === 0) return;
    function onKeyDown(event: KeyboardEvent) {
      if (onRovingKeyDown(event)) return;
      if (event.key === "Enter") {
        const command = matches[activeIndex];
        if (command) {
          event.preventDefault();
          onSelect(command);
          onClose();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, matches, activeIndex, onSelect, onClose, onRovingKeyDown]);

  // Resolve the FloatingCard anchor: either the HTMLElement passed in, or
  // the virtual anchor we mount from {x, y}.
  const resolvedAnchor: HTMLElement | null = isCoord(anchor) ? virtualEl : anchor;

  // Tooltip role on the FloatingCard so it stays passive (no focus trap).
  // The `role="menu"` lives on the inner list — the user is still typing in
  // the editor, so we must not pull focus away. Outside-click and ESC are
  // handled by us, not the FloatingCard's dialog wiring.
  return (
    <>
      {open && isCoord(anchor) ? (
        <VirtualAnchor x={anchor.x} y={anchor.y} onMount={setVirtualEl} />
      ) : null}
      <FloatingCard
        anchor={resolvedAnchor}
        open={open && matches.length > 0}
        onClose={onClose}
        placement="bottom"
        role="tooltip"
        className="slash-menu"
      >
        <div role="menu" aria-label="Slash commands" className="slash-list">
          {matches.length === 0 ? (
            <div className="slash-empty">No commands</div>
          ) : (
            matches.map((cmd, index) => {
              const Icon = ICON_MAP[cmd.iconName];
              const selected = index === activeIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  role="menuitem"
                  className={clsx("slash-row", selected && "is-active")}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onSelect(cmd);
                    onClose();
                  }}
                  // mousedown.preventDefault keeps focus inside the editor
                  // when the user clicks a row; otherwise the click would
                  // steal focus and the caret would jump.
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <span className="slash-icon">
                    <Icon size={14} />
                  </span>
                  <span className="slash-text">
                    <span className="slash-trigger">/{cmd.trigger}</span>
                    <span className="slash-name">{cmd.name}</span>
                    <span className="slash-desc">{cmd.description}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </FloatingCard>
    </>
  );
}
