"use client";

// TemplatePicker — a centered modal that renders the 9 note templates as a
// grid of cards plus a leading "Start blank" option.
//
// Uses the native <dialog> element so we get free ESC handling, the top-
// layer rendering, and a backdrop pseudo-element. Keyboard navigation
// (arrow keys + Enter) is layered on top as cards are buttons.

import clsx from "clsx";
import { useEffect, useRef } from "react";

import { ICON_MAP, PlusIcon, XIcon } from "@/components/Icon";
import { TEMPLATES } from "@/lib/mock-data/templates";
import type { Template } from "@/types";

export type TemplatePickerProps = {
  open: boolean;
  onClose: () => void;
  /** `null` is delivered when the user picks "Start blank". */
  onSelect: (template: Template | null) => void;
  /** If provided, only templates whose id is in this list are rendered. */
  templateIds?: readonly string[];
};

export function TemplatePicker({ open, onClose, onSelect, templateIds }: TemplatePickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Filter templates if a whitelist was given.
  const visible = templateIds ? TEMPLATES.filter((t) => templateIds.includes(t.id)) : TEMPLATES;

  // Drive the native <dialog> imperatively so we get top-layer rendering and
  // the built-in `::backdrop`. `showModal` traps focus and listens for ESC.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  // Native cancel event fires on ESC and on `dialog.close()`. We only want
  // to call `onClose` on user-initiated close (ESC, backdrop). Calling
  // `onClose` on cancel is fine — parent should idempotently set `open` false.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    function onCancel(event: Event) {
      event.preventDefault();
      onClose();
    }
    node.addEventListener("cancel", onCancel);
    return () => node.removeEventListener("cancel", onCancel);
  }, [onClose]);

  // Arrow-key navigation across the card grid. Wraps at the row boundaries
  // for sensible 2-col grids; when the layout collapses to 1 col on narrow
  // viewports the wrap still works (just degenerate to up/down).
  useEffect(() => {
    if (!open) return;
    const root = cardsRef.current;
    if (!root) return;
    function onKeyDown(event: KeyboardEvent) {
      if (!root) return;
      if (
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight"
      ) {
        return;
      }
      const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button.tp-card"));
      if (buttons.length === 0) return;
      const current = document.activeElement;
      const index = buttons.findIndex((b) => b === current);
      if (index === -1) {
        event.preventDefault();
        buttons[0]?.focus();
        return;
      }
      // Determine the column count from the actual layout. With a 2-col
      // grid, ArrowDown/Up jumps two; with 1-col, jumps one. Reading the
      // computed style on the grid is more robust than hard-coding.
      const gridStyle = window.getComputedStyle(root);
      const cols = gridStyle.gridTemplateColumns.split(" ").length || 1;
      let next = index;
      if (event.key === "ArrowRight") next = Math.min(buttons.length - 1, index + 1);
      else if (event.key === "ArrowLeft") next = Math.max(0, index - 1);
      else if (event.key === "ArrowDown") next = Math.min(buttons.length - 1, index + cols);
      else if (event.key === "ArrowUp") next = Math.max(0, index - cols);
      if (next !== index) {
        event.preventDefault();
        buttons[next]?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleSelectBlank() {
    onSelect(null);
    onClose();
  }

  function handleSelectTemplate(template: Template) {
    onSelect(template);
    onClose();
  }

  // Click outside the inner card closes the dialog. The <dialog> element
  // itself fills the viewport when modal, with the inner content centered.
  function handleDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="template-picker"
      aria-labelledby="template-picker-title"
      onClick={handleDialogClick}
    >
      <div className="tp-shell" onClick={(event) => event.stopPropagation()}>
        <div className="tp-head">
          <h2 id="template-picker-title">Choose a template</h2>
          <button
            type="button"
            className="tp-close"
            aria-label="Close template picker"
            onClick={onClose}
          >
            <XIcon size={14} />
          </button>
        </div>
        <div ref={cardsRef} className="tp-grid">
          <button type="button" className={clsx("tp-card", "tp-blank")} onClick={handleSelectBlank}>
            <span className="tp-icon">
              <PlusIcon size={18} />
            </span>
            <span className="tp-card-body">
              <span className="tp-card-name">Start blank</span>
              <span className="tp-card-desc">An empty page. Begin from anywhere.</span>
            </span>
          </button>
          {visible.map((template) => {
            const Icon = ICON_MAP[template.icon];
            const previewSections = template.sections
              .slice(0, 2)
              .map((s) => s.heading)
              .join(", ");
            return (
              <button
                key={template.id}
                type="button"
                className="tp-card"
                onClick={() => handleSelectTemplate(template)}
              >
                <span className="tp-icon">
                  <Icon size={18} />
                </span>
                <span className="tp-card-body">
                  <span className="tp-card-name">{template.name}</span>
                  <span className="tp-card-desc">{template.description}</span>
                  {previewSections.length > 0 ? (
                    <span className="tp-card-preview">{previewSections}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
