"use client";

import clsx from "clsx";
import { useTransition } from "react";

import { usePreferences } from "@/hooks/usePreferences";
import type { ReaderMode, ResponseStyle } from "@/types";

type Props = {
  onContinue: () => void;
  onBack: () => void;
};

const READER_MODE_OPTIONS: ReadonlyArray<{ value: ReaderMode; label: string; desc: string }> = [
  {
    value: "interleaved",
    label: "Interleaved",
    desc: "Each Arabic verse followed by its English translation.",
  },
  {
    value: "mushaf",
    label: "Mushaf",
    desc: "Arabic only, classic mushaf-style reading.",
  },
  {
    value: "translation",
    label: "Translation",
    desc: "English-only, for quiet reading.",
  },
];

const RESPONSE_STYLE_OPTIONS: ReadonlyArray<{ value: ResponseStyle; label: string; desc: string }> =
  [
    { value: "brief", label: "Brief", desc: "A few sentences. Most relevant citation." },
    { value: "standard", label: "Standard", desc: "A few paragraphs across multiple sources." },
    {
      value: "comparative",
      label: "Comparative",
      desc: "Side-by-side commentary across enabled sources.",
    },
  ];

export function ReadingPrefsStep({ onContinue, onBack }: Props) {
  const { preferences, setPreference } = usePreferences();
  const [pending, startTransition] = useTransition();

  const handleContinue = () => {
    startTransition(() => {
      onContinue();
    });
  };

  return (
    <div className="onboard-step onboard-step-wide">
      <div className="onboard-body">
        <h2 className="onboard-title">How do you like to read?</h2>
        <p className="onboard-lede">A few defaults. Each one can be changed later in Settings.</p>

        <section className="onboard-section">
          <header className="onboard-section-hd">
            <span className="lbl">Reader view</span>
            <span className="desc">How verses are laid out when you open a surah.</span>
          </header>
          <div className="onboard-grid">
            {READER_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={clsx("onboard-card", preferences.readerMode === opt.value && "on")}
                aria-pressed={preferences.readerMode === opt.value}
                onClick={() => setPreference("readerMode", opt.value)}
              >
                <span className="onboard-card-title">{opt.label}</span>
                <span className="onboard-card-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="onboard-section">
          <header className="onboard-section-hd">
            <span className="lbl">Response style</span>
            <span className="desc">How Mishkat shapes its answers.</span>
          </header>
          <div className="onboard-grid onboard-grid-3">
            {RESPONSE_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={clsx("onboard-card", preferences.responseStyle === opt.value && "on")}
                aria-pressed={preferences.responseStyle === opt.value}
                onClick={() => setPreference("responseStyle", opt.value)}
              >
                <span className="onboard-card-title">{opt.label}</span>
                <span className="onboard-card-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="onboard-section">
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
              aria-label={
                preferences.recitationEnabled ? "Disable recitation" : "Enable recitation"
              }
              onClick={() => setPreference("recitationEnabled", !preferences.recitationEnabled)}
            />
          </div>
        </section>
      </div>
      <div className="onboard-actions">
        <button type="button" className="btn lg" onClick={onBack} disabled={pending}>
          Back
        </button>
        <button
          type="button"
          className="btn primary lg"
          onClick={handleContinue}
          disabled={pending}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
