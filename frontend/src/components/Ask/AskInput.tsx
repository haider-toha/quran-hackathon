"use client";

import { AdjustIcon, SendIcon, StopIcon } from "@/components/Icon";
import type { AskState } from "@/types";

type Props = {
  state: AskState;
  value: string;
  scope: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
};

/**
 * Sticky textarea + scope chip + Sources / Ask|Stop buttons. The value is
 * controlled by the parent so an in-progress edit is preserved across
 * non-state-changing re-renders; the parent decides when to overwrite the
 * value (e.g. when the demo state flips to a different sample question).
 */
export function AskInput({ state, value, scope, onChange, onSubmit, onStop }: Props) {
  const isStreaming = state === "streaming";

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !isStreaming) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="ask-input-wrap">
      <div className="ask-input">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          onKeyDown={handleKeyDown}
          aria-label="Ask a question about this surah"
          placeholder="Ask a question…"
        />
        <div className="ask-input-foot">
          <span className="scope">
            Scoped to <span className="ref-pill">{scope}</span>
          </span>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn ghost sm">
            <AdjustIcon size={13} /> Sources
          </button>
          <button
            type="button"
            className="btn primary sm"
            onClick={isStreaming ? onStop : onSubmit}
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
    </div>
  );
}
