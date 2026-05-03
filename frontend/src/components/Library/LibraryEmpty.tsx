"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowRightIcon, BookIcon, PlusIcon } from "@/components/Icon";
import { TemplatePicker } from "@/components/TemplatePicker/TemplatePicker";
import { EMPTY_STATES } from "@/lib/copy";
import { createNoteFromTemplate } from "@/lib/notes-store";
import type { Template } from "@/types";

// Renders when the merged note list (sample + user-created) is empty AND
// no search/filter is narrowing the view. The primary CTA opens the
// TemplatePicker; on selection we create a note and navigate to its
// journal page. The secondary CTA returns to the reader.
export function LibraryEmpty() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const router = useRouter();

  function handleSelect(template: Template | null): void {
    const note = createNoteFromTemplate(template);
    router.push(`/journal?note=${encodeURIComponent(note.id)}`);
  }

  return (
    <>
      <div className="lib-empty">
        <div className="lib-empty-icon">
          <BookIcon size={22} />
        </div>
        <h2 className="lib-empty-headline">{EMPTY_STATES.library.title}</h2>
        <p className="lib-empty-body">
          Start a study with a template, or open a verse and tap Save to note.
        </p>
        <div className="lib-empty-actions">
          <button type="button" className="btn primary" onClick={() => setPickerOpen(true)}>
            <PlusIcon size={13} /> Start with a template
          </button>
          <Link href="/" className="btn">
            Open the Reader <ArrowRightIcon size={13} />
          </Link>
        </div>
      </div>
      <TemplatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
