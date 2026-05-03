"use client";

import { useEffect, useState } from "react";

import { pushNotification } from "@/lib/notifications-store";

type DeepStatus = "idle" | "running" | "completed";

// Approximate length of the simulated deep-research run, in milliseconds.
// Spec calls for 4 seconds.
const DEEP_RESEARCH_DURATION_MS = 4000;

type Hook = {
  status: DeepStatus;
  /** Kick off a new run. Idempotent while a run is already pending. */
  start: () => void;
  /** Reset back to idle (does not cancel a running timer's effect cleanup). */
  reset: () => void;
};

/**
 * Mock deep-research timer. Flips status `idle → running → completed` on a
 * fixed timeout, and pushes a notification on completion so the topbar bell
 * reflects the same state.
 *
 * Extracted from `Research.tsx` in Wave 2A — keeping the orchestrator under
 * 300 LOC and isolating the timer effect's deps from the rest of the
 * component's render path.
 */
export function useDeepResearchTimer(): Hook {
  const [status, setStatus] = useState<DeepStatus>("idle");

  useEffect(() => {
    if (status !== "running") return;
    const handle = window.setTimeout(() => {
      setStatus("completed");
      pushNotification({
        kind: "deep-research-completed",
        title: "Deep research complete",
        body: "Your research pass on this question is ready to review.",
        href: "/research",
      });
    }, DEEP_RESEARCH_DURATION_MS);
    return () => window.clearTimeout(handle);
  }, [status]);

  return {
    status,
    start: () => setStatus("running"),
    reset: () => setStatus("idle"),
  };
}
