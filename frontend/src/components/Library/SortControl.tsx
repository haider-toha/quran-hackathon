"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon } from "@/components/Icon";

export type SortKey = "recent" | "edited" | "alpha" | "linked";

type Option = { id: SortKey; label: string };

// Non-empty tuple so `OPTIONS[0]` is statically known under
// `noUncheckedIndexedAccess`.
const OPTIONS = [
  { id: "recent", label: "Recent" },
  { id: "edited", label: "Edited" },
  { id: "alpha", label: "Alphabetical" },
  { id: "linked", label: "Linked to current reading" },
] as const satisfies readonly [Option, ...Option[]];

type Props = {
  value: SortKey;
  onChange: (next: SortKey) => void;
};

// Single-select sort dropdown. The "linked" choice is only meaningful when
// the user has a `lastRead.surah` set; the parent decides whether to surface
// or hide that affordance, but we render it unconditionally here so the
// option remains discoverable.
export function SortControl({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0];
  const label = `Sort · ${current.label}`;

  return (
    <div className="lib-filter-group">
      <button
        ref={buttonRef}
        type="button"
        className="lib-filter-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span id={labelId}>{label}</span>
        <ChevronDownIcon size={11} />
      </button>
      {open ? (
        <div ref={panelRef} className="lib-filter-panel" role="listbox">
          {OPTIONS.map((option) => {
            const isSelected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={clsx("lib-filter-row", isSelected && "on")}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
              >
                <span className="lib-filter-row-mark">
                  {isSelected ? <CheckIcon size={12} /> : null}
                </span>
                <span className="lib-filter-row-label">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
