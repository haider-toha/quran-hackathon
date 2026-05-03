"use client";

import { useAdminMode } from "@/hooks/useAdminMode";
import { usePreferences } from "@/hooks/usePreferences";
import type { SuggestionFrequency, SuggestionsSurface } from "@/types";

// The user-visible (non-admin) surfaces. Admin mode unlocks two more
// (`ghost`, `margin`) but those aren't currently in the foundation
// `SuggestionsSurface` union — they're admin-only stubs surfaced inline
// here as disabled options so admins can see what's coming.
const SURFACE_OPTIONS: ReadonlyArray<{ value: SuggestionsSurface; label: string; desc: string }> = [
  {
    value: "rail",
    label: "Side rail",
    desc: "Suggestions appear in a quiet right-hand rail while you write.",
  },
  {
    value: "off",
    label: "Off",
    desc: "Don't surface suggestions. You can still summon them on demand.",
  },
];

const ADMIN_SURFACE_OPTIONS: ReadonlyArray<{ value: string; label: string; desc: string }> = [
  {
    value: "ghost",
    label: "Ghost (admin)",
    desc: "Inline ghost-text suggestions while you type.",
  },
  {
    value: "margin",
    label: "Margin (admin)",
    desc: "Margin annotations next to the active paragraph.",
  },
];

const FREQUENCY_OPTIONS: ReadonlyArray<{
  value: SuggestionFrequency;
  label: string;
  desc: string;
}> = [
  {
    value: "high",
    label: "High",
    desc: "Surface suggestions whenever the corpus has a strong match.",
  },
  {
    value: "low",
    label: "Low",
    desc: "Only surface high-confidence, novel matches.",
  },
  { value: "off", label: "Off", desc: "Never surface suggestions automatically." },
];

export function WritingSection() {
  const { preferences, setPreference } = usePreferences();
  const { admin } = useAdminMode();

  return (
    <section className="settings-section">
      <header className="settings-section-hd">
        <h2>Writing</h2>
        <p>Where and how often Mishkat surfaces suggestions while you write.</p>
      </header>

      <div className="set-section">
        <div className="set-section-hd">Suggestions surface</div>
        <div className="settings-radio-group" role="radiogroup" aria-label="Suggestions surface">
          {SURFACE_OPTIONS.map((opt) => {
            const active = preferences.suggestionsSurface === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={active ? "settings-radio-card on" : "settings-radio-card"}
                onClick={() => setPreference("suggestionsSurface", opt.value)}
              >
                <span className="settings-radio-card-title">{opt.label}</span>
                <span className="settings-radio-card-desc">{opt.desc}</span>
              </button>
            );
          })}
          {admin
            ? ADMIN_SURFACE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={false}
                  aria-disabled={true}
                  disabled
                  className="settings-radio-card admin-disabled"
                  title="Admin preview — not yet wired"
                >
                  <span className="settings-radio-card-title">{opt.label}</span>
                  <span className="settings-radio-card-desc">{opt.desc}</span>
                </button>
              ))
            : null}
        </div>
      </div>

      <div className="set-section">
        <div className="set-section-hd">Suggestion frequency</div>
        <div className="settings-radio-group" role="radiogroup" aria-label="Suggestion frequency">
          {FREQUENCY_OPTIONS.map((opt) => {
            const active = preferences.suggestionFrequency === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={active ? "settings-radio-card on" : "settings-radio-card"}
                onClick={() => setPreference("suggestionFrequency", opt.value)}
              >
                <span className="settings-radio-card-title">{opt.label}</span>
                <span className="settings-radio-card-desc">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
