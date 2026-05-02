"use client";

import type { CSSProperties } from "react";

import type { AskState } from "@/types";

type DemoState = Extract<AskState, "streaming" | "answered" | "low">;

type Props = {
  state: DemoState;
  onChange: (state: DemoState) => void;
};

const OPTIONS: ReadonlyArray<{ key: DemoState; label: string }> = [
  { key: "streaming", label: "Streaming" },
  { key: "answered", label: "Answered" },
  { key: "low", label: "Low confidence" },
];

const BUTTON_BASE: CSSProperties = {
  border: 0,
  background: "transparent",
  color: "var(--color-ink-3)",
  padding: "4px 10px",
  borderRadius: 4,
  fontSize: 11,
  fontFamily: "inherit",
  cursor: "pointer",
  fontWeight: 500,
};

const BUTTON_ACTIVE: CSSProperties = {
  ...BUTTON_BASE,
  background: "var(--color-bg-elev)",
  color: "var(--color-ink)",
  boxShadow: "var(--shadow-sm)",
};

/**
 * Inline three-way picker that swaps the Ask screen between its mock
 * states. Replaces the global "tweaks" panel from the original prototype.
 *
 * The bar is intentionally unobtrusive — it lives at the bottom of the
 * scroll region. The container is styled via `.demo-state-bar` in
 * `globals.css`; the per-button styling is local because no shared
 * `.demo-state-bar .opt` rule exists yet.
 */
export function DemoStateBar({ state, onChange }: Props) {
  return (
    <div className="demo-state-bar" role="group" aria-label="Demo state" style={{ marginTop: 24 }}>
      <span className="lbl">Demo</span>
      {OPTIONS.map((option) => {
        const active = state === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            style={active ? BUTTON_ACTIVE : BUTTON_BASE}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
