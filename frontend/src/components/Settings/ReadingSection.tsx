"use client";

import clsx from "clsx";

import { usePreferences } from "@/hooks/usePreferences";
import type { ReaderMode } from "@/types";

const READER_MODE_OPTIONS: ReadonlyArray<{ value: ReaderMode; label: string; desc: string }> = [
  {
    value: "interleaved",
    label: "Interleaved",
    desc: "Each Arabic verse followed by its English translation.",
  },
  { value: "mushaf", label: "Mushaf", desc: "Arabic only, classic mushaf-style reading." },
  { value: "translation", label: "Translation", desc: "English-only, for quiet reading." },
  {
    value: "side-by-side",
    label: "Side by side",
    desc: "Arabic and translation in parallel columns.",
  },
];

export function ReadingSection() {
  const { preferences, setPreference } = usePreferences();
  return (
    <section className="settings-section">
      <header className="settings-section-hd">
        <h2>Reading</h2>
        <p>Defaults for how the reader presents verses, prompts, and recitation.</p>
      </header>

      <div className="set-section">
        <div className="set-section-hd">Default reader view</div>
        <div className="settings-radio-group" role="radiogroup" aria-label="Default reader view">
          {READER_MODE_OPTIONS.map((opt) => {
            const active = preferences.readerMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={active ? "settings-radio-card on" : "settings-radio-card"}
                onClick={() => setPreference("readerMode", opt.value)}
              >
                <span className="settings-radio-card-title">{opt.label}</span>
                <span className="settings-radio-card-desc">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="set-section">
        <div className="set-section-hd">Reader options</div>
        <div className="set-row">
          <div>
            <div className="lbl">Reflection prompts</div>
            <div className="desc">
              Surface optional, contemplative questions next to passages as you read.
            </div>
          </div>
          <button
            type="button"
            className={clsx("toggle", preferences.showReflectionPrompts && "on")}
            aria-pressed={preferences.showReflectionPrompts}
            aria-label={
              preferences.showReflectionPrompts
                ? "Disable reflection prompts"
                : "Enable reflection prompts"
            }
            onClick={() =>
              setPreference("showReflectionPrompts", !preferences.showReflectionPrompts)
            }
          />
        </div>
        <div className="set-row">
          <div>
            <div className="lbl">Recitation playback</div>
            <div className="desc">Show controls for verse-by-verse recitation in the reader.</div>
          </div>
          <button
            type="button"
            className={clsx("toggle", preferences.recitationEnabled && "on")}
            aria-pressed={preferences.recitationEnabled}
            aria-label={preferences.recitationEnabled ? "Disable recitation" : "Enable recitation"}
            onClick={() => setPreference("recitationEnabled", !preferences.recitationEnabled)}
          />
        </div>
      </div>
    </section>
  );
}
