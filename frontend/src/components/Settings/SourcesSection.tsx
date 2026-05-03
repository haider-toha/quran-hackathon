"use client";

import { useCallback, useMemo, useState } from "react";

import { TAFSIR_93_3, TAFSIR_SOURCES } from "@/lib/mock-data";
import { usePreferences } from "@/hooks/usePreferences";
import type { TafsirSource } from "@/types";

import { SourceRow } from "./SourceRow";

export function SourcesSection() {
  const { preferences, setPreference } = usePreferences();
  const [previewOpenId, setPreviewOpenId] = useState<TafsirSource["id"] | null>(null);
  // Memoise so toggleEnabled's identity is stable across renders.
  const enabledSet = useMemo(
    () => new Set(preferences.enabledSources),
    [preferences.enabledSources],
  );

  const toggleEnabled = useCallback(
    (id: TafsirSource["id"]) => {
      const next = new Set(enabledSet);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const ordered = TAFSIR_SOURCES.filter((s) => next.has(s.id)).map((s) => s.id);
      setPreference("enabledSources", ordered);
    },
    [enabledSet, setPreference],
  );

  const togglePreview = useCallback((id: TafsirSource["id"]) => {
    setPreviewOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section className="settings-section">
      <header className="settings-section-hd">
        <h2>Tafsir sources</h2>
        <p>
          Enable the commentaries Mishkat will draw on when answering questions, generating
          summaries, and suggesting links. Source order in answers reflects classical canonicity,
          not your order here.
        </p>
      </header>
      <div className="set-section">
        <div className="set-section-hd">Classical tafsirs</div>
        {TAFSIR_SOURCES.map((source) => (
          <SourceRow
            key={source.id}
            source={source}
            enabled={enabledSet.has(source.id)}
            onToggle={() => toggleEnabled(source.id)}
            previewOpen={previewOpenId === source.id}
            onPreviewToggle={() => togglePreview(source.id)}
            sampleEntry={TAFSIR_93_3}
          />
        ))}
      </div>
    </section>
  );
}
