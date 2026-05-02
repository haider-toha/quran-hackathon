import Link from "next/link";

import type { Note } from "@/types";

type Props = {
  note: Note;
};

export function NoteCard({ note }: Props) {
  return (
    <Link href="/journal" className="note-card" aria-label={`Open note: ${note.title}`}>
      <div className="nc-title">{note.title}</div>
      <div className="nc-snip">{note.preview}</div>
      <div className="nc-foot">
        <span className="nc-link">{note.link}</span>
        {note.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="nc-tag">
            {tag}
          </span>
        ))}
        <span className="nc-date">{note.editedRelative}</span>
      </div>
    </Link>
  );
}
