"use client";

// Popover that appears when the user hovers (or focuses) a dotted-underlined
// keyword span in the compose-mode editor. Layout: source line on top
// (mono, ink-4), one-sentence body in serif, Insert + Dismiss buttons.
//
// Positioning is delegated to the shared FloatingCard so we get viewport-
// aware placement and portal rendering for free. We render as `role="tooltip"`
// rather than dialog: the user is still typing in the editor, and we must
// not steal focus.

import { FloatingCard } from "@/components/FloatingCard";
import { InsertIcon, XIcon } from "@/components/Icon";
import type { InlineSuggestion } from "@/lib/inline-suggestions";
import type { SuggestionKind } from "@/types";

type Props = {
  /** Active suggestion, or `null` when the popover should be hidden. */
  suggestion: InlineSuggestion | null;
  /** Anchor element for positioning. The keyword span itself. */
  anchor: HTMLElement | null;
  onInsert: () => void;
  onDismiss: () => void;
  onClose: () => void;
};

function accentTokenFor(kind: SuggestionKind): string {
  switch (kind) {
    case "tafsir-match":
      return "tafsir";
    case "related-verse":
      return "verse-link";
    case "related-note":
      return "ink-quiet";
    case "prompt":
      return "ai";
    default:
      return "ink-quiet";
  }
}

export function InlineSuggestionPopover({
  suggestion,
  anchor,
  onInsert,
  onDismiss,
  onClose,
}: Props) {
  return (
    <FloatingCard
      anchor={anchor}
      open={suggestion !== null && anchor !== null}
      onClose={onClose}
      placement="bottom"
      role="tooltip"
      className="inline-suggestion-popover"
    >
      {suggestion ? (
        <div
          className="inline-suggestion-popover-body"
          data-accent={accentTokenFor(suggestion.kind)}
        >
          <div className="src">{suggestion.source}</div>
          <div className="body">{suggestion.body}</div>
          <div className="actions">
            <button
              type="button"
              className="btn primary sm"
              onClick={onInsert}
              onMouseDown={(event) => event.preventDefault()}
            >
              <InsertIcon size={11} /> Insert
            </button>
            <button
              type="button"
              className="btn ghost sm"
              onClick={onDismiss}
              onMouseDown={(event) => event.preventDefault()}
              aria-label="Dismiss inline suggestion"
              title="Dismiss"
            >
              <XIcon size={11} /> Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </FloatingCard>
  );
}
