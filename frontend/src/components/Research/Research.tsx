"use client";

import clsx from "clsx";
import { useMemo, useRef, useState } from "react";

import { AlertWarnIcon, FilterIcon, QuestionIcon, ShieldIcon } from "@/components/Icon";
import { useDeepResearchTimer } from "@/hooks/useDeepResearchTimer";
import { useOnOutsideInteraction } from "@/hooks/useOnOutsideInteraction";
import type { ResearchResult, ResearchType } from "@/types";

import { DeepCompletedState, DeepIdleState, DeepRunningState } from "./DeepResearchStates";
import { ResearchCard } from "./ResearchCard";
import { ResearchModeTabs, type ResearchMode } from "./ResearchModeTabs";
import { DEFAULT_SPEAKER_FILTER, SpeakerFilter, type SpeakerFilterValue } from "./SpeakerFilter";
import { TrustLegend } from "./TrustLegend";

type FilterType = "all" | ResearchType;

const FILTER_BUTTONS: readonly { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lecture", label: "Lectures" },
  { id: "article", label: "Articles" },
  { id: "video", label: "Videos" },
];

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
  const [mode, setMode] = useState<ResearchMode>("quick");
  const deepTimer = useDeepResearchTimer();
  const [deepRevealed, setDeepRevealed] = useState(false);

  const speakers = useMemo(() => {
    return [...new Set(results.map((r) => r.speaker))].sort((a, b) => a.localeCompare(b));
  }, [results]);

  const visibleResults = useMemo(() => {
    const trustFiltered = applySpeakerFilter(results, speakerFilter);
    if (filterType === "all") return trustFiltered;
    return trustFiltered.filter((result) => result.type === filterType);
  }, [results, filterType, speakerFilter]);

  // Click-outside + Escape on the speaker filter dropdown — single shared hook.
  useOnOutsideInteraction(speakerButtonRef, () => setSpeakerFilterOpen(false), {
    enabled: speakerFilterOpen,
  });

  function startDeepResearch() {
    deepTimer.start();
    setDeepRevealed(false);
  }

  // In deep mode, results render only after the user clicks "View results".
  // In quick mode, results render immediately.
  const showResults = mode === "quick" || (mode === "deep" && deepRevealed);

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

        <ResearchModeTabs mode={mode} onChange={setMode} />

        <div className="research-q">
          <QuestionIcon size={14} />
          <span>&ldquo;{question}&rdquo;</span>
        </div>

        {mode === "deep" && deepTimer.status === "idle" ? (
          <DeepIdleState onStart={startDeepResearch} />
        ) : null}
        {mode === "deep" && deepTimer.status === "running" ? <DeepRunningState /> : null}
        {mode === "deep" && deepTimer.status === "completed" && !deepRevealed ? (
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

