"use client";

import clsx from "clsx";
import { useState } from "react";

import type { ResponseMode } from "@/types";

const MODES: readonly { id: ResponseMode; label: string }[] = [
  { id: "simple", label: "Simple" },
  { id: "detailed", label: "Detailed" },
  { id: "comparative", label: "Comparative" },
];

const SAMPLES: Readonly<Record<ResponseMode, string>> = {
  simple:
    "Your Lord has not left you. The pause was preparation, not abandonment. — Tafsir As-Saʿdī",
  detailed:
    "After a pause in revelation, the surah arrived as a direct response. The verb waddaʿaka denies a warm farewell; qalā denies a cold heart. As-Saʿdī reads the pause as deliberate nurturing — silence as preparation rather than absence.",
  comparative:
    "As-Saʿdī: silence as nurturing — God prepares what He gives. Ibn Kathīr: situational — addresses Quraysh's taunt directly. Al-Qurṭubī: emphasizes the duration (15 days) and the longing it produced.",
};

export function ResponseModePreview() {
  const [mode, setMode] = useState<ResponseMode>("detailed");

  return (
    <div style={{ marginTop: 8 }}>
      <div className="seg" style={{ marginBottom: 12 }} role="tablist" aria-label="Response mode">
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={mode === option.id}
            className={clsx(mode === option.id && "on")}
            onClick={() => setMode(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="response-mode-preview">{SAMPLES[mode]}</div>
    </div>
  );
}
