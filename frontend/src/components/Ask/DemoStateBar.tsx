"use client";

import type { CSSProperties } from "react";

import { useAdminMode } from "@/lib/flags";
import type { AskState } from "@/types";

type DemoState = Extract<AskState, "input" | "streaming" | "answered" | "low">;

type Props = {
  state: DemoState;
  onChange: (state: DemoState) => void;
};

const DEFAULT_OPTIONS: ReadonlyArray<{ key: DemoState; label: string }> = [
  { key: "input", label: "Input" },
  { key: "streaming", label: "Streaming" },
  { key: "answered", label: "Answered" },
];

const ADMIN_ONLY_OPTION: { key: DemoState; label: string } = {
  key: "low",
  label: "Low confidence",
};

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
 * Inline picker that swaps the Ask screen between its mock states. The
 * "Low confidence" option is admin-only — see spec §1.3 + §3 + §4.3.
 * Toggle admin mode with Cmd/Ctrl+Shift+. anywhere in the app.
 */
export function DemoStateBar({ state, onChange }: Props) {
  const { admin } = useAdminMode();
  const options = admin ? [...DEFAULT_OPTIONS, ADMIN_ONLY_OPTION] : DEFAULT_OPTIONS;

  return (
    <div className="demo-state-bar" role="group" aria-label="Demo state" style={{ marginTop: 24 }}>
      <span className="lbl">Demo</span>
      {options.map((option) => {
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
