"use client";

import clsx from "clsx";
import { forwardRef, useEffect, useRef, useState } from "react";

import { AdjustIcon, CheckIcon, LockIcon, SendIcon, StopIcon } from "@/components/Icon";
import { openSourcesPanel } from "@/lib/sources-panel-store";
import { useActiveTafsirSourceCount } from "@/lib/tafsir-sources-store";
import type { AskState } from "@/types";

export type SourceModeValue = {
  myNotes: boolean;
};

export const DEFAULT_SOURCE_MODE: SourceModeValue = {
  myNotes: false,
};

const LOCKED_REASON = "Quran and Tafsir are always-on for grounded answers.";

type Props = {
  state: AskState;
  value: string;
  scope: string;
  sourceMode: SourceModeValue;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onSourceModeChange: (value: SourceModeValue) => void;
  /**
   * Called on every keydown (besides Enter-submit) so the parent can run
   * slash-menu detection. Returning `true` from the parent's handler signals
   * "I consumed this event" — but for now we leave that as a future hook;
   * the parent currently only inspects the keydown to decide menu state.
   */
  onKeyDownExtra?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

// Reused by the centered + docked variants so the placeholder copy stays in
// one place. Scope is always the canonical label (e.g. "Ad-Duha 93:1–11");
// the Topbar breadcrumb is the source of truth for display.
function placeholderFor(scope: string): string {
  return `Ask about ${scope}…`;
}

/**
 * Sticky textarea + scope chip + Sources / Ask|Stop buttons. The value is
 * controlled by the parent so an in-progress edit is preserved across
 * non-state-changing re-renders; the parent decides when to overwrite the
 * value (e.g. when the demo state flips to a different sample question).
 *
 * The Sources button opens an inline popover (Cursor-style model picker) for
 * choosing which corpora the question is grounded in. Tafsir and Quran are
 * always-on; My notes is the only user-controllable toggle.
 *
 * The textarea is forward-ref'd so the parent can read the element for
 * SlashMenu anchoring.
 */
export const AskInput = forwardRef<HTMLTextAreaElement, Props>(function AskInput(
  {
    state,
    value,
    scope,
    sourceMode,
    onChange,
    onSubmit,
    onStop,
    onSourceModeChange,
    onKeyDownExtra,
  },
  ref,
) {
  const isStreaming = state === "streaming";
  const activeSourceCount = useActiveTafsirSourceCount();
  const noSourcesActive = activeSourceCount === 0;
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const sourcesButtonRef = useRef<HTMLButtonElement>(null);
  const sourcesPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sourcesOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (sourcesPanelRef.current?.contains(target)) return;
      if (sourcesButtonRef.current?.contains(target)) return;
      setSourcesOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSourcesOpen(false);
        sourcesButtonRef.current?.focus();
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [sourcesOpen]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (onKeyDownExtra) onKeyDownExtra(event);
    if (event.defaultPrevented) return;
    if (event.key === "Enter" && !isStreaming) {
      // Cmd/Ctrl+Enter always submits, even when Shift is held — useful as a
      // power shortcut from a multi-line draft. Bare Enter submits when no
      // modifier is held; Shift+Enter falls through to the textarea so the
      // user can insert a newline.
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta) {
        event.preventDefault();
        if (!noSourcesActive) onSubmit();
        return;
      }
      if (!event.shiftKey) {
        event.preventDefault();
        if (!noSourcesActive) onSubmit();
      }
    }
  }

  function toggleMyNotes() {
    onSourceModeChange({ ...sourceMode, myNotes: !sourceMode.myNotes });
  }

  return (
    <div className="ask-input-wrap">
      <div className="ask-input">
        <textarea
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          onKeyDown={handleKeyDown}
          aria-label={`Ask a question about ${scope}`}
          placeholder={placeholderFor(scope)}
        />
        <div className="ask-input-foot">
          <span style={{ flex: 1 }} />
          <div className="ask-sources-wrap">
            <button
              ref={sourcesButtonRef}
              type="button"
              className={clsx("btn ghost sm", sourcesOpen && "on")}
              onClick={() => setSourcesOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={sourcesOpen}
            >
              <AdjustIcon size={13} /> Sources
            </button>
            {sourcesOpen ? (
              <div
                ref={sourcesPanelRef}
                className="ask-sources-panel"
                role="listbox"
                aria-label="Sources"
              >
                <div
                  className="ask-sources-row locked on"
                  role="option"
                  aria-selected="true"
                  aria-disabled="true"
                  title={LOCKED_REASON}
                >
                  <span className="ask-sources-row-mark">
                    <LockIcon size={11} />
                  </span>
                  <span className="ask-sources-row-label">Tafsir</span>
                </div>
                <div
                  className="ask-sources-row locked on"
                  role="option"
                  aria-selected="true"
                  aria-disabled="true"
                  title={LOCKED_REASON}
                >
                  <span className="ask-sources-row-mark">
                    <LockIcon size={11} />
                  </span>
                  <span className="ask-sources-row-label">Quran</span>
                </div>
                <button
                  type="button"
                  role="option"
                  aria-selected={sourceMode.myNotes}
                  className={clsx("ask-sources-row", sourceMode.myNotes && "on")}
                  onClick={toggleMyNotes}
                >
                  <span className="ask-sources-row-mark">
                    {sourceMode.myNotes ? <CheckIcon size={11} /> : null}
                  </span>
                  <span className="ask-sources-row-label">My notes</span>
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="btn primary sm"
            onClick={isStreaming ? onStop : onSubmit}
            disabled={!isStreaming && noSourcesActive}
            title={
              !isStreaming && noSourcesActive
                ? "Enable at least one tafsir source to ask a question."
                : undefined
            }
          >
            {isStreaming ? (
              <>
                <StopIcon size={12} /> Stop
              </>
            ) : (
              <>
                <SendIcon size={12} /> Ask
              </>
            )}
          </button>
        </div>
      </div>
      {!isStreaming && noSourcesActive ? (
        <p className="ask-input-notice" role="status">
          No sources enabled.{" "}
          <button
            type="button"
            className="ask-input-notice-link"
            onClick={() => openSourcesPanel()}
          >
            Enable at least one tafsir
          </button>{" "}
          to ask grounded questions.
        </p>
      ) : null}
    </div>
  );
});
