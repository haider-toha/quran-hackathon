"use client";

import { useCallback, useState } from "react";

import type { TafsirEntry, TafsirSource } from "@/types";

import { ResponseModePreview } from "./ResponseModePreview";
import { SourceRow } from "./SourceRow";

type SourceId = TafsirSource["id"];
type EnabledMap = Partial<Record<SourceId, boolean>>;

type Props = {
  sources: readonly TafsirSource[];
  sampleEntry: TafsirEntry;
};

function initialEnabledMap(sources: readonly TafsirSource[]): EnabledMap {
  const map: EnabledMap = {};
  for (const source of sources) map[source.id] = source.enabledByDefault;
  return map;
}

export function Settings({ sources, sampleEntry }: Props) {
  const [enabled, setEnabled] = useState<EnabledMap>(() => initialEnabledMap(sources));
  const [previewOpenId, setPreviewOpenId] = useState<SourceId | null>(null);

  // React 19 "reset on prop change" pattern — if the sources list changes
  // (HMR, future remote fetch), drop our stale toggle map.
  const [lastSources, setLastSources] = useState(sources);
  if (lastSources !== sources) {
    setLastSources(sources);
    setEnabled(initialEnabledMap(sources));
    setPreviewOpenId(null);
  }

  const toggleEnabled = useCallback((id: SourceId) => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const togglePreview = useCallback((id: SourceId) => {
    setPreviewOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="settings">
      <div className="settings-inner">
        <div className="settings-hd">
          <h1>Tafsir sources</h1>
          <p>
            Enable the commentaries Mishkāt will draw on when answering questions, generating
            summaries, and suggesting links. Source order in answers reflects classical canonicity,
            not your order here.
          </p>
        </div>

        <div className="set-section">
          <div className="set-section-hd">Classical tafsirs</div>
          {sources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              enabled={enabled[source.id] ?? source.enabledByDefault}
              onToggle={() => toggleEnabled(source.id)}
              previewOpen={previewOpenId === source.id}
              onPreviewToggle={() => togglePreview(source.id)}
              sampleEntry={sampleEntry}
            />
          ))}
        </div>

        <div className="set-section">
          <div className="set-section-hd">Default answer style</div>
          <div className="set-row">
            <div>
              <div className="lbl">Response mode</div>
              <div className="desc">Sets the default depth — you can switch per-question.</div>
            </div>
          </div>
          <ResponseModePreview />
        </div>
      </div>
    </div>
  );
}
