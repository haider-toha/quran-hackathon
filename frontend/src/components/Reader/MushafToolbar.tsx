"use client";

import { useEffect, useRef } from "react";

import {
  CopyIcon,
  HeadphonesIcon,
  PenIcon,
  QuestionIcon,
  SparkleIcon,
  XIcon,
} from "@/components/Icon";

export type ToolbarAction = "explain" | "ask" | "note" | "play" | "copy";

type Props = {
  rect: DOMRect;
  onAction: (action: ToolbarAction) => void;
  onClose: () => void;
};

const TOOLBAR_OFFSET_TOP = 44;
const TOOLBAR_APPROX_WIDTH = 360;
const VIEWPORT_PADDING = 12;

function clampLeft(rect: DOMRect): number {
  if (typeof window === "undefined") return rect.left;
  const desired = rect.left + rect.width / 2 - TOOLBAR_APPROX_WIDTH / 2;
  const max = window.innerWidth - TOOLBAR_APPROX_WIDTH - VIEWPORT_PADDING;
  return Math.max(VIEWPORT_PADDING, Math.min(desired, Math.max(VIEWPORT_PADDING, max)));
}

export function MushafToolbar({ rect, onAction, onClose }: Props) {
  const top = rect.top - TOOLBAR_OFFSET_TOP;
  const left = clampLeft(rect);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div ref={ref} className="mushaf-toolbar" style={{ top, left }} role="toolbar">
      <button type="button" onClick={() => onAction("explain")}>
        <SparkleIcon size={13} /> Explain
      </button>
      <span className="div" aria-hidden="true" />
      <button type="button" onClick={() => onAction("ask")}>
        <QuestionIcon size={13} /> Ask
      </button>
      <span className="div" aria-hidden="true" />
      <button type="button" onClick={() => onAction("note")}>
        <PenIcon size={13} /> Save to note
      </button>
      <span className="div" aria-hidden="true" />
      <button
        type="button"
        onClick={() => onAction("play")}
        title="Play recitation"
        aria-label="Play recitation"
      >
        <HeadphonesIcon size={13} />
      </button>
      <button type="button" onClick={() => onAction("copy")} title="Copy" aria-label="Copy ayah">
        <CopyIcon size={13} />
      </button>
      <button
        type="button"
        onClick={onClose}
        title="Close"
        aria-label="Close toolbar"
        style={{ color: "var(--color-ink-4)" }}
      >
        <XIcon size={13} />
      </button>
    </div>
  );
}
