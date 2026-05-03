"use client";

import clsx from "clsx";

type Props = {
  options: readonly string[];
  selected: readonly string[];
  onChange: (next: readonly string[]) => void;
};

// Multi-select chip strip. Tags click-to-toggle; the selection is held by
// the parent so search + filters can AND together.
export function TagFilter({ options, selected, onChange }: Props) {
  if (options.length === 0) return null;

  function toggle(tag: string): void {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div className="lib-chip-row" role="group" aria-label="Filter notes by tag">
      {options.map((tag) => {
        const on = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            className={clsx("lib-chip", on && "on")}
            aria-pressed={on}
            onClick={() => toggle(tag)}
          >
            <span className="lib-chip-hash">#</span>
            {tag}
          </button>
        );
      })}
    </div>
  );
}
