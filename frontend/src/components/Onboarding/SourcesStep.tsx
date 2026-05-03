"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import { SourceRow } from "@/components/Settings/SourceRow";
import { TAFSIR_93_3, TAFSIR_SOURCES } from "@/lib/mock-data";
import { usePreferences } from "@/hooks/usePreferences";
import type { TafsirSource } from "@/types";

type Props = {
  onContinue: () => void;
  onBack: () => void;
};

export function SourcesStep({ onContinue, onBack }: Props) {
  const { preferences, setPreference } = usePreferences();
  const [previewOpenId, setPreviewOpenId] = useState<TafsirSource["id"] | null>(null);
  const [pending, startTransition] = useTransition();

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
      // Preserve declared TAFSIR_SOURCES order on persistence so canonicity
      // ordering is stable when read back.
      const ordered = TAFSIR_SOURCES.filter((s) => next.has(s.id)).map((s) => s.id);
      setPreference("enabledSources", ordered);
    },
    [enabledSet, setPreference],
  );

  const togglePreview = useCallback((id: TafsirSource["id"]) => {
    setPreviewOpenId((prev) => (prev === id ? null : id));
  }, []);

  const handleContinue = () => {
    startTransition(() => {
      onContinue();
    });
  };

  return (
    <div className="onboard-step onboard-step-wide">
      <div className="onboard-body">
        <h2 className="onboard-title">Choose your sources</h2>
        <p className="onboard-lede">
          Mishkāt draws on classical tafsir when answering questions. Pick the commentaries you want
          included. You can change this later in Settings.
        </p>
        <div className="set-section onboard-sources">
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
