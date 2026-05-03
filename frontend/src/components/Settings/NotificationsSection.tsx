"use client";

import { useState } from "react";

import clsx from "clsx";

export function NotificationsSection() {
  // Placeholder local state — no backend wire. The toggles render so the
  // section has shape, but they reset on reload (no localStorage key).
  const [deepResearch, setDeepResearch] = useState(false);
  const [suggestionBursts, setSuggestionBursts] = useState(false);

  return (
    <section className="settings-section">
      <header className="settings-section-hd">
        <h2>Notifications</h2>
        <p>How and when Mishkāt may quietly let you know something happened.</p>
      </header>
      <div className="set-section">
        <div className="set-row">
          <div>
            <div className="lbl">Notify me when deep research completes</div>
            <div className="desc">
              Long-running research runs in the background. We&rsquo;ll surface a quiet badge when
              it finishes.
            </div>
          </div>
          <button
            type="button"
            className={clsx("toggle", deepResearch && "on")}
            aria-pressed={deepResearch}
            aria-label={
              deepResearch
                ? "Disable deep research notifications"
                : "Enable deep research notifications"
            }
            onClick={() => setDeepResearch((v) => !v)}
          />
        </div>
        <div className="set-row">
          <div>
            <div className="lbl">Notify on suggestion bursts</div>
            <div className="desc">
              When several strong suggestions appear at once, surface a single grouped notice rather
              than letting them stack.
            </div>
          </div>
          <button
            type="button"
            className={clsx("toggle", suggestionBursts && "on")}
            aria-pressed={suggestionBursts}
            aria-label={
              suggestionBursts
                ? "Disable suggestion burst notifications"
                : "Enable suggestion burst notifications"
            }
            onClick={() => setSuggestionBursts((v) => !v)}
          />
        </div>
        <div className="set-row settings-row-disabled">
          <div>
            <div className="lbl">Email digest</div>
            <div className="desc">A weekly summary of what you read, asked, and noted.</div>
          </div>
          <span className="chip">Coming soon</span>
        </div>
      </div>
    </section>
  );
}
