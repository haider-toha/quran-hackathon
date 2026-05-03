"use client";

// AnswerViewToggle — small segmented control that flips an answer between
// the synthesized prose view and the by-source comparative view (Phase 7).
// The component is purely presentational; the persisted preference lives
// on the active `ChatThread.preferences` and is read/written by the
// `AnsweredView` parent so the toggle reflects the per-conversation choice
// even after a reload.

import clsx from "clsx";

import type { AnswerViewMode } from "@/lib/chat-store";

type Props = {
  value: AnswerViewMode;
  onChange: (next: AnswerViewMode) => void;
};

const OPTIONS: readonly { value: AnswerViewMode; label: string }[] = [
  { value: "synthesized", label: "Synthesized" },
  { value: "by-source", label: "By source" },
];

export function AnswerViewToggle({ value, onChange }: Props) {
  return (
    <div className="answer-view-toggle" role="tablist" aria-label="Answer rendering mode">
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={clsx("answer-view-toggle-btn", active && "is-active")}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
