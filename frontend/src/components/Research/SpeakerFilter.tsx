"use client";

import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon, ChevronRightIcon, PlusIcon, XIcon } from "@/components/Icon";

export type TrustGate = "verified-only" | "include-unknown" | "include-all";

export type SpeakerFilterValue = {
  gate: TrustGate;
  whitelist: readonly string[];
  blacklist: readonly string[];
};

export const DEFAULT_SPEAKER_FILTER: SpeakerFilterValue = {
  gate: "include-unknown",
  whitelist: [],
  blacklist: [],
};

const GATE_OPTIONS: readonly { id: TrustGate; label: string }[] = [
  { id: "verified-only", label: "Verified only" },
  { id: "include-unknown", label: "Include unknown" },
  { id: "include-all", label: "Include all" },
];

type Props = {
  value: SpeakerFilterValue;
  onChange: (value: SpeakerFilterValue) => void;
  onClose: () => void;
  speakers: readonly string[];
};

export function SpeakerFilter({ value, onChange, onClose, speakers }: Props) {
  // Hold a draft locally — apply on submit, abandon on close-without-apply.
  const [draft, setDraft] = useState<SpeakerFilterValue>(value);
  const [whitelistOpen, setWhitelistOpen] = useState(true);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC closes the dropdown. Listen on the dialog so we don't fight other
  // global handlers above us in the tree.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }
    const node = dialogRef.current;
    node?.addEventListener("keydown", onKeyDown);
    node?.focus();
    return () => node?.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function setGate(gate: TrustGate) {
    setDraft((prev) => ({ ...prev, gate }));
  }

  function toggleSpeaker(list: "whitelist" | "blacklist", speaker: string) {
    setDraft((prev) => {
      const current = prev[list];
      const next = current.includes(speaker)
        ? current.filter((s) => s !== speaker)
        : [...current, speaker];
      return { ...prev, [list]: next };
    });
  }

  function apply() {
    onChange(draft);
    onClose();
  }

  function reset() {
    setDraft(DEFAULT_SPEAKER_FILTER);
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Speaker filters"
      tabIndex={-1}
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        right: 0,
        zIndex: 30,
        width: 320,
        background: "var(--color-bg-elev)",
        border: "1px solid var(--color-line-strong)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-lg)",
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        outline: "none",
      }}
    >
      <fieldset
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          margin: 0,
          padding: 0,
          border: 0,
        }}
      >
        <legend
          style={{
            fontSize: 11,
            color: "var(--color-ink-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          Trust gate
        </legend>
        {GATE_OPTIONS.map((option) => (
          <label
            key={option.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              color: "var(--color-ink-2)",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="trust-gate"
              value={option.id}
              checked={draft.gate === option.id}
              onChange={() => setGate(option.id)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <SpeakerGroup
        title="Whitelist speakers"
        open={whitelistOpen}
        onToggle={() => setWhitelistOpen((v) => !v)}
        selected={draft.whitelist}
        speakers={speakers}
        onToggleSpeaker={(s) => toggleSpeaker("whitelist", s)}
        tone="positive"
      />
      <SpeakerGroup
        title="Blacklist speakers"
        open={blacklistOpen}
        onToggle={() => setBlacklistOpen((v) => !v)}
        selected={draft.blacklist}
        speakers={speakers}
        onToggleSpeaker={(s) => toggleSpeaker("blacklist", s)}
        tone="negative"
      />

      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "flex-end",
          paddingTop: 6,
          borderTop: "1px solid var(--color-line)",
        }}
      >
        <button type="button" className="btn sm ghost" onClick={reset}>
          Reset
        </button>
        <button type="button" className="btn sm primary" onClick={apply}>
          Apply
        </button>
      </div>
    </div>
  );
}

type GroupProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  selected: readonly string[];
  speakers: readonly string[];
  onToggleSpeaker: (speaker: string) => void;
  tone: "positive" | "negative";
};

function SpeakerGroup({
  title,
  open,
  onToggle,
  selected,
  speakers,
  onToggleSpeaker,
  tone,
}: GroupProps) {
  const groupId = `speaker-group-${tone}`;
  // Available = speakers not yet selected. Selected go in the chip row.
  const available = speakers.filter((s) => !selected.includes(s));
  const negative = tone === "negative";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={groupId}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
          fontSize: 11.5,
          color: "var(--color-ink-2)",
          fontWeight: 500,
          letterSpacing: "0.01em",
        }}
      >
        {open ? <ChevronDownIcon size={11} /> : <ChevronRightIcon size={11} />}
        {title}
        <span style={{ color: "var(--color-ink-4)", fontWeight: 400 }}>
          {selected.length > 0 ? `(${selected.length})` : null}
        </span>
      </button>
      {open ? (
        <div
          id={groupId}
          style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}
        >
          {selected.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {selected.map((speaker) => (
                <button
                  key={speaker}
                  type="button"
                  onClick={() => onToggleSpeaker(speaker)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 6px 2px 8px",
                    fontSize: 11,
                    borderRadius: 999,
                    border: `1px solid ${negative ? "var(--color-flagged)" : "var(--color-note-line)"}`,
                    background: negative ? "var(--color-bg-deep)" : "var(--color-note-bg)",
                    color: negative ? "var(--color-ink)" : "var(--color-note)",
                    cursor: "pointer",
                  }}
                  aria-label={`Remove ${speaker}`}
                >
                  {speaker}
                  <XIcon size={9} />
                </button>
              ))}
            </div>
          ) : null}
          {available.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {available.map((speaker) => (
                <button
                  key={speaker}
                  type="button"
                  onClick={() => onToggleSpeaker(speaker)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 6px 2px 8px",
                    fontSize: 11,
                    borderRadius: 999,
                    border: "1px dashed var(--color-line-strong)",
                    background: "transparent",
                    color: "var(--color-ink-3)",
                    cursor: "pointer",
                  }}
                  aria-label={`Add ${speaker}`}
                >
                  <PlusIcon size={9} /> {speaker}
                </button>
              ))}
            </div>
          ) : null}
          {available.length === 0 && selected.length === 0 ? (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--color-ink-4)",
                fontStyle: "italic",
              }}
            >
              No speakers in this list yet.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
