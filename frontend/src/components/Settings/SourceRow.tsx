import clsx from "clsx";

import { EyeIcon } from "@/components/Icon";
import type { TafsirEntry, TafsirSource } from "@/types";

import { SourcePreview } from "./SourcePreview";

type Props = {
  source: TafsirSource;
  enabled: boolean;
  onToggle: () => void;
  previewOpen: boolean;
  onPreviewToggle: () => void;
  sampleEntry: TafsirEntry;
};

export function SourceRow({
  source,
  enabled,
  onToggle,
  previewOpen,
  onPreviewToggle,
  sampleEntry,
}: Props) {
  const isDefault = source.enabledByDefault && source.isCanonical;

  return (
    <div className={clsx("source-row", !enabled && "disabled")}>
      <div>
        <div className="name">{source.name}</div>
        <div className="meta-row">
          <span className="author">{source.author}</span>
          <span style={{ color: "var(--color-ink-5)" }} aria-hidden="true">
            ·
          </span>
          <span>{source.century}</span>
          <span className="lang-chip">{source.language}</span>
          {isDefault ? (
            <span className="chip tafsir" style={{ height: 17, fontSize: 9.5 }}>
              Default
            </span>
          ) : null}
        </div>
        <div className="desc">{source.methodology}</div>
        <button
          type="button"
          className="preview-link"
          onClick={onPreviewToggle}
          aria-expanded={previewOpen}
        >
          <EyeIcon size={11} /> {previewOpen ? "Hide" : "Preview"} sample passage
        </button>
        {previewOpen ? <SourcePreview sampleEntry={sampleEntry} sourceName={source.name} /> : null}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <button
          type="button"
          className={clsx("toggle", enabled && "on")}
          onClick={onToggle}
          aria-label={enabled ? `Disable ${source.name}` : `Enable ${source.name}`}
          aria-pressed={enabled}
        />
        <span
          style={{
            fontSize: 10.5,
            color: enabled ? "var(--color-note)" : "var(--color-ink-4)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
    </div>
  );
}
