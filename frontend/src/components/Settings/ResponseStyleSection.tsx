"use client";

import { usePreferences } from "@/hooks/usePreferences";
import type { ResponseStyle } from "@/types";

const OPTIONS: ReadonlyArray<{ value: ResponseStyle; label: string; desc: string }> = [
  {
    value: "brief",
    label: "Brief",
    desc: "A few sentences. The single most relevant citation, no surrounding scaffolding.",
  },
  {
    value: "standard",
    label: "Standard",
    desc: "A few paragraphs synthesising the core sources. The default for most questions.",
  },
  {
    value: "comparative",
    label: "Comparative",
    desc: "Side-by-side commentary across enabled sources, organised by interpretive angle.",
  },
];

export function ResponseStyleSection() {
  const { preferences, setPreference } = usePreferences();
  return (
    <section className="settings-section">
      <header className="settings-section-hd">
        <h2>Response style</h2>
        <p>How Mishkāt shapes its answers. You can switch styles for an individual question too.</p>
      </header>
      <div className="settings-radio-group" role="radiogroup" aria-label="Response style">
        {OPTIONS.map((opt) => {
          const active = preferences.responseStyle === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={active ? "settings-radio-card on" : "settings-radio-card"}
              onClick={() => setPreference("responseStyle", opt.value)}
            >
              <span className="settings-radio-card-title">{opt.label}</span>
              <span className="settings-radio-card-desc">{opt.desc}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
