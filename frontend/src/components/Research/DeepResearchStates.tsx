"use client";

// The three card-state components for the deep-research flow:
// `idle` (call-to-action), `running` (shimmer), `completed` (review). Each
// is a stateless presentational view; the parent (`Research.tsx`) owns the
// status from the `useDeepResearchTimer` hook.

export function DeepIdleState({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        border: "1px dashed var(--color-line-strong)",
        background: "var(--color-bg-elev)",
        borderRadius: "var(--radius)",
        padding: "22px 18px",
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-ink)",
        }}
      >
        Run a deep research pass on this question
      </div>
      <div style={{ fontSize: 12.5, color: "var(--color-ink-3)", lineHeight: 1.55 }}>
        Mishkāt will gather corroborating sources, cross-check citations, and surface a longer-form
        report. You can keep reading; we&rsquo;ll notify you when it completes.
      </div>
      <div>
        <button type="button" className="btn sm primary" onClick={onStart}>
          Start deep research
        </button>
      </div>
    </div>
  );
}

export function DeepRunningState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        border: "1px solid var(--color-line)",
        background: "var(--color-bg-elev)",
        borderRadius: "var(--radius)",
        padding: "20px 18px",
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-ink)",
        }}
      >
        Research running…
      </div>
      <div style={{ fontSize: 12.5, color: "var(--color-ink-3)" }}>
        We&rsquo;ll notify you when this completes.
      </div>
      <div
        aria-hidden="true"
        style={{
          marginTop: 4,
          height: 6,
          borderRadius: 3,
          overflow: "hidden",
          background: "var(--color-line-2)",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent, var(--color-accent-soft), transparent)",
            animation: "shimmer 1.4s linear infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export function DeepCompletedState({ onView }: { onView: () => void }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-note-line)",
        background: "var(--color-note-bg)",
        borderRadius: "var(--radius)",
        padding: "20px 18px",
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-ink)",
        }}
      >
        Deep research complete
      </div>
      <div style={{ fontSize: 12.5, color: "var(--color-ink-3)" }}>
        The report is ready for review.
      </div>
      <div>
        <button type="button" className="btn sm primary" onClick={onView}>
          View results
        </button>
      </div>
    </div>
  );
}
