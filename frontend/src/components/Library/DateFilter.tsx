"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon } from "@/components/Icon";

export type DateRange = "all" | "today" | "week" | "month";

type Option = { id: DateRange; label: string };

// Tuple form (not `readonly Option[]`) so TS keeps the head as a non-optional
// element — that lets us read OPTIONS[0] without a non-null assertion under
// `noUncheckedIndexedAccess`.
const OPTIONS = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
] as const satisfies readonly [Option, ...Option[]];

type Props = {
  value: DateRange;
  onChange: (next: DateRange) => void;
};

// Single-select dropdown for a coarse-grained date filter. Buckets are
// computed in the parent against `note.editedAt`.
export function DateFilter({ value, onChange }: Props) {
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

  // OPTIONS is typed as a non-empty tuple, so OPTIONS[0] is statically known.
  const current = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0];
  const label = `Date · ${current.label}`;

  return (
    <div className="lib-filter-group">
      <button
        ref={buttonRef}
        type="button"
        className={clsx("lib-filter-button", value !== "all" && "on")}
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
