"use client";

import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export function AccountSection() {
  const flags = useFeatureFlags();

  return (
    <section className="settings-section">
      <header className="settings-section-hd">
        <h2>Account</h2>
        <p>Your data, on your terms. Both actions below are placeholders for now.</p>
      </header>
      <div className="set-section">
        <div className="set-row">
          <div>
            <div className="lbl">Export notes</div>
            <div className="desc">
              Download every note you&rsquo;ve written, with their attached citations, as a single
              archive.
            </div>
          </div>
          <button
            type="button"
            className="btn"
            disabled={!flags.notesExport}
            title={flags.notesExport ? undefined : "Coming soon"}
          >
            Export
          </button>
        </div>
        <div className="set-row">
          <div>
            <div className="lbl">Delete account</div>
            <div className="desc">
              Permanently remove every note, every preference, every dismissal. Cannot be undone.
            </div>
          </div>
          <button
            type="button"
            className="btn settings-btn-destructive"
            disabled={!flags.deleteAccount}
            title={flags.deleteAccount ? undefined : "Coming soon"}
          >
            Delete
          </button>
        </div>
      </div>
    </section>
  );
}
