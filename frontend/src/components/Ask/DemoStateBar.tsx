"use client";

import type { CSSProperties } from "react";

import { useAdminMode } from "@/hooks/useAdminMode";
import type { AskScenario, AskState } from "@/types";

type DemoState = Extract<AskState, "input" | "streaming" | "answered" | "low">;

type Props = {
  state: DemoState;
  onChange: (state: DemoState) => void;
  scenarios?: readonly AskScenario[];
  scenarioId?: string;
  onScenarioChange?: (id: string) => void;
  variantId?: string;
  onVariantChange?: (id: string) => void;
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

const SELECT_BASE: CSSProperties = {
  fontFamily: "inherit",
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 4,
  border: "1px solid var(--color-line)",
  background: "var(--color-bg-elev)",
  color: "var(--color-ink)",
  cursor: "pointer",
};

/**
 * Inline picker that swaps the Ask screen between its mock states. The
 * "Low confidence" option is admin-only — see spec §1.3 + §3 + §4.3.
 * Toggle admin mode with Cmd/Ctrl+Shift+. anywhere in the app.
 *
 * When admin mode is on AND `scenarios` is provided, two extra selects
 * appear: a scenario picker and a variant picker. They cycle the mock
 * `Answer` / `Deferral` shown for the current state, so QA can exercise
 * every authored scenario without leaving the Ask screen.
 */
export function DemoStateBar({
  state,
  onChange,
  scenarios,
  scenarioId,
  onScenarioChange,
  variantId,
  onVariantChange,
}: Props) {
  const { admin } = useAdminMode();
  const options = admin ? [...DEFAULT_OPTIONS, ADMIN_ONLY_OPTION] : DEFAULT_OPTIONS;

  const showScenarioPicker = admin && scenarios && scenarios.length > 1;
  const activeScenario = scenarios?.find((s) => s.id === scenarioId) ?? scenarios?.[0];
  const showVariantPicker =
    showScenarioPicker && activeScenario && activeScenario.variants.length > 1;

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

      {showScenarioPicker && onScenarioChange ? (
        <>
          <span aria-hidden="true" style={{ color: "var(--color-ink-4)", margin: "0 4px" }}>
            ·
          </span>
          <label style={{ fontSize: 10, color: "var(--color-ink-4)" }}>
            Scenario
            <select
              aria-label="Demo scenario"
              value={activeScenario?.id ?? ""}
              onChange={(event) => onScenarioChange(event.target.value)}
              style={{ ...SELECT_BASE, marginLeft: 6 }}
            >
              {scenarios?.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}

      {showVariantPicker && activeScenario && onVariantChange ? (
        <label style={{ fontSize: 10, color: "var(--color-ink-4)" }}>
          Variant
          <select
            aria-label="Demo variant"
            value={variantId ?? activeScenario.variants[0]?.id ?? ""}
            onChange={(event) => onVariantChange(event.target.value)}
            style={{ ...SELECT_BASE, marginLeft: 6 }}
          >
            {activeScenario.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.intent}
                {variant.edge ? " · edge" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
