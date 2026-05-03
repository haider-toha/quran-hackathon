import Link from "next/link";

import { SparkleIcon } from "@/components/Icon";
import type { Note } from "@/types";

type Props = {
  note: Note;
  /**
   * Card variant renders a tile (used in the grid layout); row variant
   * renders a horizontal table row. Both surface the same Note fields with
   * different layout chrome — colocating them keeps the markup in sync as
   * the Note shape evolves.
   */
  variant: "card" | "row";
};

export function NoteListItem({ note, variant }: Props) {
  if (variant === "card") {
    return (
      <Link
        href={`/journal?note=${encodeURIComponent(note.id)}`}
        className="note-card"
        aria-label={`Open note: ${note.title}`}
      >
        <div className="nc-title">{note.title}</div>
        <div className="nc-snip">{note.preview}</div>
        <div className="nc-foot">
          {note.link ? <span className="nc-link">{note.link}</span> : null}
          {note.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="nc-tag">
              {tag}
            </span>
          ))}
          {note.aiAssisted ? (
            <span className="note-ai-badge" aria-label="AI-assisted">
              <SparkleIcon size={10} />
              AI
            </span>
          ) : null}
          <span className="nc-date">{note.editedRelative}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/journal?note=${encodeURIComponent(note.id)}`}
      className="note-row"
      aria-label={`Open note: ${note.title}`}
    >
      <div className="nr-main">
        <div className="nr-title">{note.title}</div>
        <div className="nr-snip">{note.preview}</div>
      </div>
      <div className="nr-tags">
        {note.tags.map((tag) => (
          <span key={tag} className="nr-tag">
            {tag}
          </span>
        ))}
      </div>
      <div>{note.link ? <span className="nr-link">{note.link}</span> : null}</div>
      <div className="nr-date" style={{ textAlign: "right" }}>
        {note.aiAssisted ? (
          <span className="note-ai-badge" aria-label="AI-assisted">
            <SparkleIcon size={10} />
            AI
          </span>
        ) : null}
        <span className="nr-date-text">{note.editedRelative}</span>
      </div>
    </Link>
  );
}
