import Link from "next/link";

import { SparkleIcon } from "@/components/Icon";
import type { Note } from "@/types";

type Props = {
  note: Note;
};

export function NoteRow({ note }: Props) {
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
