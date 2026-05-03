import Link from "next/link";

import { SparkleIcon } from "@/components/Icon";
import type { Note } from "@/types";

type Props = {
  note: Note;
};

export function NoteCard({ note }: Props) {
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
