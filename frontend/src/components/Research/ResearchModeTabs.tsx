"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";

export type ResearchMode = "quick" | "deep";

type Tab = {
  id: ResearchMode;
  label: string;
  copy: string;
};

const MODE_TABS: readonly Tab[] = [
  {
    id: "quick",
    label: "Quick lookup",
    copy: "Sub-10s lookup, surfaces tafsir and corroborating sources.",
  },
  {
    id: "deep",
    label: "Deep research",
    copy: "Extended research. Returns when complete.",
  },
];

// Hoisted style objects — referential stability across renders so React
// can skip re-applying `style` on the underlying DOM nodes.
const STYLE_TABLIST: CSSProperties = {
  display: "flex",
  gap: 4,
  padding: 3,
  background: "var(--color-bg-deep)",
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius)",
  width: "fit-content",
  marginBottom: 10,
};

const STYLE_TAB_ACTIVE: CSSProperties = {
  border: 0,
  background: "var(--color-bg-elev)",
  boxShadow: "var(--shadow-sm)",
};

const STYLE_TAB_INACTIVE: CSSProperties = {
  border: 0,
  background: "transparent",
};

const STYLE_COPY: CSSProperties = {
  fontSize: 12,
  color: "var(--color-ink-3)",
  fontFamily: "var(--font-serif)",
  fontStyle: "italic",
  marginBottom: 18,
};

type Props = {
  mode: ResearchMode;
  onChange: (mode: ResearchMode) => void;
};

/**
 * "Quick lookup" / "Deep research" mode picker plus the italic copy line
 * directly underneath. Extracted from `Research.tsx` in Wave 2A so the
 * orchestrator stays under 300 LOC.
 */
export function ResearchModeTabs({ mode, onChange }: Props) {
  const activeTab = MODE_TABS.find((tab) => tab.id === mode) ?? MODE_TABS[0];
  const headerCopy = activeTab?.copy ?? "";

  return (
    <>
      <div role="tablist" aria-label="Research mode" style={STYLE_TABLIST}>
        {MODE_TABS.map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={clsx("btn", "sm", !active && "ghost")}
              style={active ? STYLE_TAB_ACTIVE : STYLE_TAB_INACTIVE}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div style={STYLE_COPY}>{headerCopy}</div>
    </>
  );
}
