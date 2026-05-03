"use client";

import clsx from "clsx";

import { useFeatureFlags, useSetFlag } from "@/lib/flags";
import type { FeatureFlags } from "@/types";

type FlagKey = keyof FeatureFlags;

const FLAG_DESCRIPTIONS: Readonly<Record<FlagKey, { label: string; desc: string }>> = {
  slashCommands: {
    label: "Slash commands",
    desc: "Enable the `/` menu inside notes (search, ayah, template, etc.).",
  },
  suggestionsRail: {
    label: "Suggestions rail",
    desc: "Show the right-hand suggestions rail while writing notes.",
  },
  deepResearch: {
    label: "Deep research",
    desc: "Enable the long-form, multi-source research surface.",
  },
  recitation: {
    label: "Recitation",
    desc: "Enable verse-by-verse recitation playback in the reader.",
  },
  notesExport: {
    label: "Notes export",
    desc: "Enable the Export button on the Account tab.",
  },
  deleteAccount: {
    label: "Delete account",
    desc: "Enable the Delete button on the Account tab.",
  },
  adminAskStateLow: {
    label: "Force Ask deferral state",
    desc: "Surface the `low` confidence option in the Ask demo state bar.",
  },
};

export function AdminSection() {
  const flags = useFeatureFlags();
  const setFlag = useSetFlag();
  const keys = Object.keys(FLAG_DESCRIPTIONS) as readonly FlagKey[];

  return (
    <section className="settings-section">
      <header className="settings-section-hd">
        <h2>Admin (developer)</h2>
        <p>
          Visible because admin mode is on (<kbd className="kbd">⌘⇧·</kbd>). Toggle individual
          feature flags below. State persists in localStorage.
        </p>
      </header>
      <div className="set-section">
        {keys.map((key) => {
          const meta = FLAG_DESCRIPTIONS[key];
          const value = flags[key];
          return (
            <div key={key} className="set-row">
              <div>
                <div className="lbl">{meta.label}</div>
                <div className="desc">{meta.desc}</div>
                <code className="settings-flag-key">{key}</code>
              </div>
              <button
                type="button"
                className={clsx("toggle", value && "on")}
                aria-pressed={value}
                aria-label={value ? `Disable ${meta.label}` : `Enable ${meta.label}`}
                onClick={() => setFlag(key, !value)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
