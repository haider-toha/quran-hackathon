"use client";

import clsx from "clsx";

import { usePreferences } from "@/lib/preferences-context";
import type { Note } from "@/types";

import { NoteBody } from "./NoteBody";
import { NoteToolbar } from "./NoteToolbar";
import { SuggestionsRail } from "./SuggestionsRail";
import { VerseContext } from "./VerseContext";

type Props = {
  note: Note;
};

export function Journal({ note }: Props) {
  const { preferences } = usePreferences();
  const showRail = preferences.suggestions === "rail";
  const linkedAyah = parseLinkedAyah(note.link);

  return (
    <div className="journal">
      <div
        className="journal-pane"
        style={{
          flex: "0 0 38%",
          minWidth: 360,
          maxWidth: 540,
          background: "var(--color-bg-deep)",
        }}
      >
        <div className="pane-head">
          <span className="pane-title">Ad-Ḍuḥā · 93</span>
          <span className="pane-spacer" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--color-ink-4)",
            }}
          >
            linked to note
          </span>
        </div>
        <VerseContext linkedAyah={linkedAyah} />
      </div>

      <div className="journal-divider" />

      <div className="journal-pane right" style={{ flex: 1 }}>
        <NoteToolbar />
        <div
          className={clsx("note-doc-wrap", !showRail && "no-margin")}
          style={{ flex: 1, minHeight: 0 }}
        >
          <NoteBody note={note} suggestions={preferences.suggestions} />
          {showRail ? <SuggestionsRail /> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Pulls the ayah number out of a `note.link` like `"93:3"` or `"93:6-8"`.
 * Returns 0 when the format doesn't match — the VerseContext will then just
 * render no row as "linked".
 */
function parseLinkedAyah(link: string): number {
  const match = /^\d+:(\d+)/.exec(link);
  if (!match) return 0;
  return Number(match[1]);
}
