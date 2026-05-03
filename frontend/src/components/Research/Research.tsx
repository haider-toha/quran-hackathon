"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

import { AlertWarnIcon, FilterIcon, QuestionIcon, ShieldIcon } from "@/components/Icon";
import { pushNotification } from "@/lib/notifications-store";
import type { ResearchResult, ResearchType } from "@/types";

import { ResearchCard } from "./ResearchCard";
import { DEFAULT_SPEAKER_FILTER, SpeakerFilter, type SpeakerFilterValue } from "./SpeakerFilter";
import { TrustLegend } from "./TrustLegend";

type FilterType = "all" | ResearchType;
type Mode = "quick" | "deep";
type DeepStatus = "idle" | "running" | "completed";

const FILTER_BUTTONS: readonly { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lecture", label: "Lectures" },
  { id: "article", label: "Articles" },
  { id: "video", label: "Videos" },
];

const MODE_TABS: readonly { id: Mode; label: string; copy: string }[] = [
  {
    id: "quick",
    label: "Quick lookup",
    copy: "Sub-10s lookup, surfaces tafsir and corroborating sources.",
  },
  {
    id: "deep",
    label: "Deep research",
    copy: "Extended research. Returns when complete.",
  },
];

// Approximate length of the simulated deep-research run, in milliseconds.
// Spec calls for 4 seconds.
const DEEP_RESEARCH_DURATION_MS = 4000;

type Props = {
  results: readonly ResearchResult[];
  question: string;
  totalResults: number;
};

function applySpeakerFilter(
  results: readonly ResearchResult[],
  filter: SpeakerFilterValue,
): readonly ResearchResult[] {
  return results.filter((result) => {
    // Hard blacklist — wins regardless of trust gate.
    if (filter.blacklist.includes(result.speaker)) return false;
    // Whitelist gates: when populated, only those speakers pass.
    if (filter.whitelist.length > 0 && !filter.whitelist.includes(result.speaker)) {
      return false;
    }
    if (filter.gate === "verified-only") return result.trust === "verified";
    if (filter.gate === "include-unknown") return result.trust !== "flagged";
    return true;
  });
}

export function Research({ results, question, totalResults }: Props) {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [speakerFilter, setSpeakerFilter] = useState<SpeakerFilterValue>(DEFAULT_SPEAKER_FILTER);
  const [speakerFilterOpen, setSpeakerFilterOpen] = useState(false);
  const speakerButtonRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("quick");
  const [deepStatus, setDeepStatus] = useState<DeepStatus>("idle");
  const [deepRevealed, setDeepRevealed] = useState(false);

  const speakers = useMemo(() => {
    return [...new Set(results.map((r) => r.speaker))].sort((a, b) => a.localeCompare(b));
  }, [results]);

  const visibleResults = useMemo(() => {
    const trustFiltered = applySpeakerFilter(results, speakerFilter);
    if (filterType === "all") return trustFiltered;
    return trustFiltered.filter((result) => result.type === filterType);
  }, [results, filterType, speakerFilter]);

  // Click-outside on the speaker filter dropdown.
  useEffect(() => {
    if (!speakerFilterOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (speakerButtonRef.current?.contains(target)) return;
      setSpeakerFilterOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [speakerFilterOpen]);

  // Mock deep-research timer. When the timer fires we both flip the status
  // and push a notification, so the topbar bell reflects the same state.
  useEffect(() => {
    if (deepStatus !== "running") return;
    const handle = window.setTimeout(() => {
      setDeepStatus("completed");
      pushNotification({
        kind: "deep-research-completed",
        title: "Deep research complete",
        body: "Your research pass on this question is ready to review.",
        href: "/research",
      });
    }, DEEP_RESEARCH_DURATION_MS);
    return () => window.clearTimeout(handle);
  }, [deepStatus]);

  function startDeepResearch() {
    setDeepStatus("running");
    setDeepRevealed(false);
  }

  // In deep mode, results render only after the user clicks "View results".
  // In quick mode, results render immediately.
  const showResults = mode === "quick" || (mode === "deep" && deepRevealed);

  const activeMode = MODE_TABS.find((tab) => tab.id === mode) ?? MODE_TABS[0];
  const headerCopy = activeMode?.copy ?? "";

  return (
    <div className="research">
      <div className="research-inner">
        <div className="research-hd">
          <h1>External research</h1>
          <span className="chip ext">
            <AlertWarnIcon size={10} /> Outside the tafsir corpus
          </span>
        </div>

        <div className="research-disc">
          <div className="ic">
            <ShieldIcon size={14} />
          </div>
          <div>
            Results below come from third-party lectures, articles, and videos — they aren&apos;t
            part of the verified tafsir corpus and aren&apos;t held to the same standard. Speakers
            carry trust signals based on your settings; treat anything marked{" "}
            <strong style={{ color: "var(--color-ext)" }}>unknown</strong> as preliminary.
          </div>
        </div>

        <TrustLegend />

        <div
          role="tablist"
          aria-label="Research mode"
          style={{
            display: "flex",
            gap: 4,
            padding: 3,
            background: "var(--color-bg-deep)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius)",
            width: "fit-content",
            marginBottom: 10,
          }}
        >
          {MODE_TABS.map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className={clsx("btn", "sm", !active && "ghost")}
                style={{
                  border: 0,
                  background: active ? "var(--color-bg-elev)" : "transparent",
                  boxShadow: active ? "var(--shadow-sm)" : undefined,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--color-ink-3)",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            marginBottom: 18,
          }}
        >
          {headerCopy}
        </div>

        <div className="research-q">
          <QuestionIcon size={14} />
          <span>&ldquo;{question}&rdquo;</span>
        </div>

        {mode === "deep" && deepStatus === "idle" ? (
          <DeepIdleState onStart={startDeepResearch} />
        ) : null}
        {mode === "deep" && deepStatus === "running" ? <DeepRunningState /> : null}
        {mode === "deep" && deepStatus === "completed" && !deepRevealed ? (
          <DeepCompletedState onView={() => setDeepRevealed(true)} />
        ) : null}

        {showResults ? (
          <>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 18,
                flexWrap: "wrap",
                alignItems: "center",
              }}
              role="tablist"
              aria-label="Filter research results"
            >
              {FILTER_BUTTONS.map((button) => {
                const isActive = filterType === button.id;
                return (
                  <button
                    key={button.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={clsx("btn", "sm", !isActive && "ghost")}
                    onClick={() => setFilterType(button.id)}
                  >
                    {button.label}
                  </button>
                );
              })}
              <span style={{ flex: 1 }} />
              <div ref={speakerButtonRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  className="btn sm ghost"
                  aria-expanded={speakerFilterOpen}
                  aria-haspopup="dialog"
                  onClick={() => setSpeakerFilterOpen((v) => !v)}
                >
                  <FilterIcon size={12} /> Speaker filters
                </button>
                {speakerFilterOpen ? (
                  <SpeakerFilter
                    value={speakerFilter}
                    speakers={speakers}
                    onChange={setSpeakerFilter}
                    onClose={() => setSpeakerFilterOpen(false)}
                  />
                ) : null}
              </div>
            </div>

            {visibleResults.length === 0 ? (
              <div className="empty">
                <div className="ic-wrap">
                  <FilterIcon size={20} />
                </div>
                <div className="ttl">No results in this filter</div>
                <div className="sub">
                  Adjust the format tabs or speaker filters to widen the results.
                </div>
              </div>
            ) : (
              visibleResults.map((result) => <ResearchCard key={result.id} result={result} />)
            )}

            <div
              style={{
                marginTop: 28,
                padding: "20px 0",
                textAlign: "center",
                color: "var(--color-ink-4)",
                fontSize: 12,
                fontStyle: "italic",
                fontFamily: "var(--font-serif)",
              }}
            >
              Showing {visibleResults.length} of {totalResults} results.{" "}
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  color: "var(--color-ink-3)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  fontStyle: "inherit",
                  textDecoration: "underline",
                }}
              >
                Show more
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function DeepIdleState({ onStart }: { onStart: () => void }) {
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

function DeepRunningState() {
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

function DeepCompletedState({ onView }: { onView: () => void }) {
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
