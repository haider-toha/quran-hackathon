"use client";

// SourcesChip — the "N sources active" affordance that lives next to the
// scope breadcrumb. Clicking opens a popover listing each tafsir source
// (mocked from TAFSIR_SOURCES) with an enable/disable toggle. The
// open/close flag lives in `lib/sources-panel-store` (Phase 9) so the
// global ⌘⇧S shortcut and the `/sources` slash command can flip the
// popover from anywhere on the page. The per-source enabled map lives in
// `lib/tafsir-sources-store` (Phase 10) so the AskInput composer can read
// the active count and disable the Ask button when no sources remain.

import clsx from "clsx";
import { useCallback, useRef } from "react";

import { CheckIcon, LayersIcon } from "@/components/Icon";
import { useOnOutsideInteraction } from "@/hooks/useOnOutsideInteraction";
import { TAFSIR_SOURCES } from "@/lib/mock-data";
import {
  closeSourcesPanel,
  toggleSourcesPanel,
  useSourcesPanelOpen,
} from "@/lib/sources-panel-store";
import {
  toggleTafsirSource,
  useActiveTafsirSourceCount,
  useTafsirSources,
} from "@/lib/tafsir-sources-store";
import type { TafsirSource } from "@/types";

export function SourcesChip() {
  const open = useSourcesPanelOpen();
  const enabled = useTafsirSources();
  const activeCount = useActiveTafsirSourceCount();

  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => closeSourcesPanel(), []);
  useOnOutsideInteraction(containerRef, close, { enabled: open });

  return (
    <div className="sources-chip-wrap" ref={containerRef}>
      <button
        type="button"
        className={clsx("sources-chip", open && "open")}
        onClick={toggleSourcesPanel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <LayersIcon size={12} />
        <span className="num">{activeCount}</span>
        <span className="lbl">{activeCount === 1 ? "source active" : "sources active"}</span>
      </button>
      {open ? (
        <div className="sources-chip-panel" role="dialog" aria-label="Active tafsir sources">
          <div className="sources-chip-head">Tafsir sources</div>
          <div className="sources-chip-list">
            {TAFSIR_SOURCES.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                enabled={enabled[source.id] ?? false}
                onToggle={() => toggleTafsirSource(source.id)}
              />
            ))}
          </div>
          <div className="sources-chip-foot">
            Toggle which commentaries the AI may cite. At least one must stay enabled.
          </div>
        </div>
      ) : null}
    </div>
  );
}

type RowProps = {
  source: TafsirSource;
  enabled: boolean;
  onToggle: () => void;
};

function SourceRow({ source, enabled, onToggle }: RowProps) {
  return (
    <button
      type="button"
      className={clsx("sources-chip-row", enabled && "on")}
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
    >
      <span className="sources-chip-row-mark" aria-hidden>
        {enabled ? <CheckIcon size={11} /> : null}
      </span>
      <span className="sources-chip-row-body">
        <span className="sources-chip-row-name">{source.name}</span>
        <span className="sources-chip-row-meta">
          {source.author} · {source.century}
        </span>
      </span>
    </button>
  );
}
