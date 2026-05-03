"use client";

import { useState, useSyncExternalStore } from "react";

import { XIcon } from "@/components/Icon";

const STORAGE_KEY = "mishkat:research:legend-dismissed";

type Row = {
  level: "verified" | "unknown" | "flagged";
  label: string;
  body: string;
};

const ROWS: readonly Row[] = [
  {
    level: "verified",
    label: "Verified scholar",
    body: "Speaker has institutional credentials and a public scholarly record.",
  },
  {
    level: "unknown",
    label: "Unknown speaker",
    body: "We don't yet have enough signals to verify this speaker.",
  },
  {
    level: "flagged",
    label: "Flagged content",
    body: "This source has been flagged for inaccuracy or controversy. Read with caution.",
  },
];

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Quota / privacy mode — drop silently.
  }
}

// Returns `true` once we've hydrated on the client. Same pattern FloatingCard
// uses: SSR returns false, client returns true, no setState-in-effect.
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function TrustLegend() {
  const hydrated = useHydrated();
  // After hydration, seed from sessionStorage. The component re-renders on
  // hydration flip, so the snapshot we read here is correct on first paint.
  const [dismissed, setDismissed] = useState<boolean>(false);
  const initialDismissed = hydrated ? readDismissed() : false;
  const isDismissed = dismissed || initialDismissed;

  if (!hydrated || isDismissed) return null;

  function onDismiss() {
    writeDismissed();
    setDismissed(true);
  }

  return (
    <section
      role="region"
      aria-labelledby="trust-legend-title"
      style={{
        border: "1px solid var(--color-line)",
        background: "var(--color-bg-elev)",
        borderRadius: "var(--radius)",
        padding: "14px 16px",
        marginBottom: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2
          id="trust-legend-title"
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-ink)",
            letterSpacing: "-0.005em",
          }}
        >
          Trust signals
        </h2>
        <button
          type="button"
          className="iconbtn"
          aria-label="Dismiss legend"
          onClick={onDismiss}
          style={{ width: 24, height: 24 }}
        >
          <XIcon size={12} />
        </button>
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {ROWS.map((row) => (
          <li
            key={row.level}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 12,
              color: "var(--color-ink-2)",
              lineHeight: 1.55,
            }}
          >
            <span
              aria-hidden="true"
              className={`trust-dot ${row.level}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                marginTop: 5,
                flexShrink: 0,
              }}
            />
            <span>
              <strong style={{ color: "var(--color-ink)", fontWeight: 500 }}>{row.label}</strong>
              <span style={{ color: "var(--color-ink-3)" }}> — {row.body}</span>
            </span>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn sm" onClick={onDismiss}>
          Got it
        </button>
      </div>
    </section>
  );
}
