"use client";

// NoteOverflowMenu — top-right `…` button on the V2 writing pane that opens
// a tiny menu with note-level actions (Download, Copy link, Share). The menu
// lives inside the local pane (no portal) so it positions naturally beneath
// the trigger via CSS absolute positioning. Outside-click + ESC close.

import { useCallback, useRef, useState, type ComponentType } from "react";

import { DownloadIcon, LinkIcon, MoreIcon, ShareIcon, type IconProps } from "@/components/Icon";
import { useOnOutsideInteraction } from "@/hooks/useOnOutsideInteraction";
import { copyToClipboard } from "@/lib/clipboard";
import { showToast } from "@/lib/toast-store";
import type { Note } from "@/types";

type Props = {
  note: Note;
};

type SharePayload = {
  title: string;
  text: string;
  url: string;
};

const DOWNLOAD_FILENAME_FALLBACK = "note";

export function NoteOverflowMenu({ note }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);
  // useOnOutsideInteraction handles both outside-pointer and Escape-key
  // dismissal in a single effect.
  useOnOutsideInteraction(containerRef, close, { enabled: open });

  const handleDownload = useCallback(() => {
    setOpen(false);
    if (typeof window === "undefined") return;
    const safeTitle = (note.title || DOWNLOAD_FILENAME_FALLBACK)
      .replace(/[^a-z0-9-_ ]+/giu, "")
      .trim()
      .slice(0, 64);
    const filename = `${safeTitle.length > 0 ? safeTitle : DOWNLOAD_FILENAME_FALLBACK}.md`;
    const blob = new Blob([note.body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    // Free the blob URL on the next tick — the click has already started
    // the download stream.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast("Downloaded");
  }, [note.body, note.title]);

  const buildShare = useCallback((): SharePayload => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    return {
      title: note.title,
      text: note.preview || note.title,
      url,
    };
  }, [note.preview, note.title]);

  const handleCopyLink = useCallback(async () => {
    setOpen(false);
    if (typeof window === "undefined") return;
    const ok = await copyToClipboard(window.location.href);
    showToast(ok ? "Link copied" : "Couldn't copy", { variant: ok ? "success" : "error" });
  }, []);

  const handleShare = useCallback(async () => {
    setOpen(false);
    if (typeof window === "undefined") return;
    const payload = buildShare();
    const nav = window.navigator as Navigator & {
      share?: (data: SharePayload) => Promise<void>;
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share(payload);
        return;
      } catch {
        // User cancelled or share failed — silently fall back to copy-link
        // so the affordance is never a dead end.
      }
    }
    const ok = await copyToClipboard(payload.url);
    showToast(ok ? "Link copied" : "Couldn't copy", { variant: ok ? "success" : "error" });
  }, [buildShare]);

  return (
    <div className="journal-v2-overflow" ref={containerRef}>
      <button
        type="button"
        className="note-overflow-trigger"
        aria-label="Note actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreIcon size={14} />
      </button>
      {open ? (
        <div className="note-overflow-menu" role="menu" aria-label="Note actions">
          <MenuRow
            label="Download"
            description="Markdown (.md)"
            icon={DownloadIcon}
            onSelect={handleDownload}
          />
          <MenuRow
            label="Copy link"
            description="Share this note's URL"
            icon={LinkIcon}
            onSelect={handleCopyLink}
          />
          <MenuRow
            label="Share"
            description="Share via system sheet"
            icon={ShareIcon}
            onSelect={handleShare}
          />
        </div>
      ) : null}
    </div>
  );
}

type MenuRowProps = {
  label: string;
  description: string;
  icon: ComponentType<IconProps>;
  onSelect: () => void;
};

// Keep MenuRow local to NoteOverflowMenu — no other surface needs this
// shape today, and inlining it keeps the menu self-contained.
function MenuRow({ label, description, icon: IconComp, onSelect }: MenuRowProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className="note-overflow-row"
      // mousedown.preventDefault keeps focus inside the editor after a
      // click; the row's onClick still fires.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
    >
      <span className="note-overflow-icon" aria-hidden>
        <IconComp size={13} />
      </span>
      <span className="note-overflow-text">
        <span className="note-overflow-label">{label}</span>
        <span className="note-overflow-desc">{description}</span>
      </span>
    </button>
  );
}
