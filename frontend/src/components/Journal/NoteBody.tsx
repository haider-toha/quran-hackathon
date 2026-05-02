import { LinkIcon } from "@/components/Icon";
import type { Note, Suggestions } from "@/types";

import { renderMarkdown } from "./markdown";

type Props = {
  note: Note;
  suggestions: Suggestions;
};

export function NoteBody({ note, suggestions }: Props) {
  const showMargin = suggestions === "margin" || suggestions === "ghost";
  const showGhost = suggestions === "ghost";

  return (
    <div className="note-doc">
      <input className="note-title" defaultValue={note.title} aria-label="Note title" />

      <div className="note-meta">
        <span className="link-pill">
          <LinkIcon size={11} /> {note.link}
        </span>
        {note.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        <span style={{ marginLeft: "auto" }}>Edited {note.editedRelative} · auto-saved</span>
      </div>

      <div className="note-body">
        {renderMarkdown(note.body)}

        {showMargin ? (
          <p>
            {"When grief comes in waves, the wave isn't the silence — the wave is "}
            {showGhost ? (
              <span className="ghost-text">
                my response to silence. The silence itself is steady.
              </span>
            ) : (
              "something else entirely."
            )}
          </p>
        ) : null}

        <h2>Linked notes</h2>
        <p>This connects to two other notes I&rsquo;ve been carrying:</p>

        <div className="ai-block">
          <div className="lbl">
            <span
              className="chip-ic"
              style={{
                width: 10,
                height: 10,
                display: "inline-block",
                background: "currentColor",
                borderRadius: 2,
              }}
            />{" "}
            AI summary · As-Saʿdī
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 14.5,
              color: "var(--color-ink-2)",
              lineHeight: 1.65,
            }}
          >
            &ldquo;He has not left you since He took charge of you, nor disliked you since He loved
            you. He continues to nurture you in the finest way, raising your station from one state
            to another.&rdquo;
          </p>
        </div>

        <p style={{ color: "var(--color-ink-3)" }}>
          I&rsquo;ll come back to this when I&rsquo;m in a clearer mood. For now: keep reading. The
          next verse promises that what&rsquo;s coming is better than what was — but I notice I want
          to take that promise out of context, and I don&rsquo;t think that&rsquo;s how this works.
        </p>
      </div>
    </div>
  );
}
