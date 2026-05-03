"use client";

// HelpOverlay — the centered modal that lists every keyboard shortcut
// grouped by area (Phase 9). Opened by pressing `?` from anywhere outside
// an editable element; closed by Esc, click-outside, or the close button.
//
// The overlay is rendered once at the AppShell root so the open flag —
// kept in `lib/help-overlay-store` — can be flipped from any handler
// without prop-drilling through the layout. Mirrors the Toaster: portal
// into the document body and gate the portal until hydrated.

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { XIcon } from "@/components/Icon";
import { closeHelpOverlay, useHelpOverlayOpen } from "@/lib/help-overlay-store";
import { kbdChord } from "@/lib/kbd";

type ShortcutDef = {
  // Pre-rendered chord array passed to `kbdChord`.
  chord: readonly string[];
  description: string;
};

type ShortcutGroup = {
  title: string;
  shortcuts: readonly ShortcutDef[];
};

const GROUPS: readonly ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { chord: ["cmd", "K"], description: "Open command palette" },
      { chord: ["cmd", "1"], description: "Go to Read" },
      { chord: ["cmd", "2"], description: "Go to Ask" },
      { chord: ["cmd", "3"], description: "Go to Journal" },
      { chord: ["cmd", "4"], description: "Go to Library" },
      { chord: ["cmd", "5"], description: "Go to Research" },
      { chord: ["cmd", ","], description: "Go to Settings" },
      { chord: ["?"], description: "Show this shortcut help" },
      { chord: ["esc"], description: "Close any open overlay" },
    ],
  },
  {
    title: "Ask",
    shortcuts: [
      { chord: ["cmd", "/"], description: "Open scope picker" },
      { chord: ["cmd", "enter"], description: "Submit question" },
      { chord: ["cmd", "shift", "S"], description: "Toggle sources panel" },
      { chord: ["cmd", "shift", "C"], description: "Toggle context panel" },
      { chord: ["/"], description: "Open slash menu" },
    ],
  },
  {
    title: "Reader",
    shortcuts: [
      { chord: ["cmd", "1"], description: "Jump back to Reader" },
      { chord: ["esc"], description: "Close any open overlay" },
    ],
  },
];

// Returns `true` only after client hydration. SSR snapshot is `false`, so
// the portal call is gated until `document.body` exists. Mirrors the
// Toaster helper.
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function HelpOverlay() {
  const open = useHelpOverlayOpen();
  const hydrated = useHydrated();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Close on Esc + outside click while the overlay is open. `Escape` is the
  // canonical "dismiss any overlay" key and we don't want to fight the
  // global keydown listener for it — register a focused handler here.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeHelpOverlay();
      }
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (dialogRef.current?.contains(target)) return;
      closeHelpOverlay();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Move focus into the dialog on open so screen readers and keyboard
  // users land somewhere sensible. The container is `tabIndex=-1` so it
  // accepts programmatic focus.
  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    if (node) node.focus();
  }, [open]);

  const handleClose = useCallback(() => closeHelpOverlay(), []);

  if (!hydrated) return null;
  if (!open) return null;

  return createPortal(
    <div className="help-overlay-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="help-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-overlay-title"
        tabIndex={-1}
      >
        <header className="help-overlay-head">
          <h2 id="help-overlay-title" className="help-overlay-title">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            className="help-overlay-close"
            onClick={handleClose}
            aria-label="Close shortcut help"
          >
            <XIcon size={12} />
          </button>
        </header>
        <div className="help-overlay-body">
          {GROUPS.map((group) => (
            <section key={group.title} className="help-overlay-group">
              <h3 className="help-overlay-group-title">{group.title}</h3>
              <ul className="help-overlay-list">
                {group.shortcuts.map((sc) => (
                  <ShortcutRow key={`${group.title}-${sc.description}`} shortcut={sc} />
                ))}
              </ul>
            </section>
          ))}
        </div>
        <footer className="help-overlay-foot">
          Press <kbd className="kbd-inline">?</kbd> anytime · <kbd className="kbd-inline">Esc</kbd>{" "}
          to close
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutDef }) {
  return (
    <li className="help-overlay-row">
      <span className="help-overlay-desc">{shortcut.description}</span>
      <kbd className="help-overlay-kbd">{kbdChord(...shortcut.chord)}</kbd>
    </li>
  );
}
