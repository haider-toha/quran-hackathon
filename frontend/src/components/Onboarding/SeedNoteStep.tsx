"use client";

import { useTransition } from "react";

import { addUserNote } from "@/lib/notes-store";
import type { Note } from "@/types";

type Props = {
  onContinue: () => void;
  onBack: () => void;
};

const WELCOME_NOTE_BODY = [
  "## Save to note",
  "",
  "When something in the reader catches you — a verse, a tafsir excerpt, a phrase — highlight it and choose **Save to note**. It lands here, attributed and dated, ready to be lived with.",
  "",
  "## Slash commands",
  "",
  "Inside any note, type `/` to summon a small menu. A few you'll use often:",
  "",
  "- `/search` — search the corpus from inside a note",
  "- `/ayah` — pull in a verse with full citation",
  "- `/template` — insert a structured note template",
  "",
  "Mishkat is quiet on purpose. Nothing here is urgent. Begin where you are.",
].join("\n");

const WELCOME_NOTE_PREVIEW =
  "When something in the reader catches you — a verse, a tafsir excerpt, a phrase — highlight it and choose Save to note. It lands here, attributed and dated, ready to be lived with.";

function buildWelcomeNote(): Note {
  const now = new Date();
  return {
    id: "welcome-mishkat",
    title: "Welcome to Mishkat",
    preview: WELCOME_NOTE_PREVIEW,
    body: WELCOME_NOTE_BODY,
    link: "",
    tags: ["welcome"],
    editedRelative: "just now",
    editedAbsolute: now.toLocaleString(),
    editedAt: now.toISOString(),
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  };
}

export function SeedNoteStep({ onContinue, onBack }: Props) {
  const [pending, startTransition] = useTransition();

  const handleContinue = () => {
    startTransition(() => {
      addUserNote(buildWelcomeNote());
      onContinue();
    });
  };

  return (
    <div className="onboard-step">
      <div className="onboard-body">
        <h2 className="onboard-title">A note to start with</h2>
        <p className="onboard-lede">
          We&rsquo;ll seed your library with a brief note that explains two things you&rsquo;ll lean
          on often.
        </p>
        <ul className="onboard-list">
          <li>
            <strong>Save to note.</strong> Highlight any verse or tafsir excerpt and choose
            &ldquo;Save to note&rdquo; — it&rsquo;s saved with attribution.
          </li>
          <li>
            <strong>Slash commands.</strong> Inside a note, type <code>/</code> to summon search,
            verse insertion, templates, and more.
          </li>
        </ul>
      </div>
      <div className="onboard-actions">
        <button type="button" className="btn lg" onClick={onBack} disabled={pending}>
          Back
        </button>
        <button
          type="button"
          className="btn primary lg"
          onClick={handleContinue}
          disabled={pending}
        >
          Begin
        </button>
      </div>
    </div>
  );
}
