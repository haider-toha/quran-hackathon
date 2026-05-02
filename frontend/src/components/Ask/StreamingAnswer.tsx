"use client";

import { STREAMING_TEXT } from "@/lib/mock-data";

/**
 * Mock streaming answer — renders the canned partial text followed by a
 * blinking cursor. No real streaming happens; the cursor animation lives
 * in `globals.css` (`.stream-dot`).
 */
export function StreamingAnswer() {
  return (
    <div className="answer" aria-live="polite" aria-busy="true">
      <p>
        {STREAMING_TEXT}
        <span className="stream-dot" aria-hidden="true" />
      </p>
    </div>
  );
}
