"use client";

import clsx from "clsx";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { ChevronDownIcon, SearchIcon, TagIcon } from "@/components/Icon";

type Props = {
  options: readonly string[];
  selected: readonly string[];
  onChange: (next: readonly string[]) => void;
};

const SEARCH_THRESHOLD = 10;

// Tag filter as a popover — replaces the old always-visible chip cloud.
// The button shows the current selection count; the panel renders the
// available tags as toggleable chips. When the corpus has more than
// SEARCH_THRESHOLD tags we surface a quick search affordance to keep the
// panel scannable.
export function TagPopover({ options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  // Reset the local search input every time the popover closes so the next
  // open starts clean. We use the React 19 "derived-from-prop reset"
  // pattern (conditional setState during render) instead of a useEffect —
  // the lint rule rightly flags setState-in-effect as a cascading-render
  // anti-pattern when the trigger is a render-phase value (`open`) we
  // already have.
  const [trackedOpen, setTrackedOpen] = useState(open);
  if (trackedOpen !== open) {
    setTrackedOpen(open);
    if (!open && query.length > 0) {
      setQuery("");
    }
  }

  function toggle(tag: string): void {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  const filtered = useMemo<readonly string[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return options;
    return options.filter((tag) => tag.toLowerCase().includes(q));
  }, [options, query]);

  const count = selected.length;
  const showSearch = options.length > SEARCH_THRESHOLD;
  const disabled = options.length === 0;

  return (
    <div className="lib2-filter-group">
      <button
        ref={buttonRef}
        type="button"
        className={clsx("lib2-filter-button", count > 0 && "on")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
      >
        <TagIcon size={12} />
        <span id={labelId}>{count > 0 ? `Tags · ${count}` : "Tags"}</span>
        <ChevronDownIcon size={11} />
      </button>
      {open ? (
        <div
          ref={panelRef}
          className="lib2-filter-panel lib2-tag-panel"
          role="dialog"
          aria-label="Filter notes by tag"
        >
          {showSearch ? (
            <div className="lib2-tag-search">
              <SearchIcon size={12} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tags…"
                aria-label="Search tags"
                autoFocus
              />
            </div>
          ) : null}
          <div className="lib2-tag-grid" role="group">
            {filtered.length === 0 ? (
              <div className="lib2-tag-empty">No tags match.</div>
            ) : (
              filtered.map((tag) => {
                const on = selected.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={clsx("lib2-tag-chip", on && "on")}
                    aria-pressed={on}
                    onClick={() => toggle(tag)}
                  >
                    <span className="lib2-tag-hash">#</span>
                    {tag}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
