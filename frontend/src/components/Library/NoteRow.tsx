import Link from "next/link";

import type { Note } from "@/types";

type Props = {
  note: Note;
};

export function NoteRow({ note }: Props) {
  return (
    <Link href="/journal" className="note-row" aria-label={`Open note: ${note.title}`}>
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
      <div>
        <span className="nr-link">{note.link}</span>
      </div>
      <div className="nr-date" style={{ textAlign: "right" }}>
        {note.editedRelative}
      </div>
    </Link>
  );
}
