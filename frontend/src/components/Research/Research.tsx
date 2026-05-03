"use client";

import clsx from "clsx";
import { useMemo, useRef, useState, type FormEvent } from "react";

import { ChevronDownIcon, FilterIcon, QuestionIcon, SearchIcon } from "@/components/Icon";
import { useDeepResearchTimer } from "@/hooks/useDeepResearchTimer";
import { useOnOutsideInteraction } from "@/hooks/useOnOutsideInteraction";
import type { ResearchResult, ResearchSynthesisGroup, ResearchType, TrustLevel } from "@/types";

import { DeepCompletedState, DeepRunningState } from "./DeepResearchStates";
import { ResearchCard } from "./ResearchCard";
import { DEFAULT_SPEAKER_FILTER, SpeakerFilter, type SpeakerFilterValue } from "./SpeakerFilter";

type FilterType = "all" | ResearchType;

const FILTER_BUTTONS: readonly { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lecture", label: "Lectures" },
  { id: "article", label: "Articles" },
  { id: "video", label: "Videos" },
];

const TRUST_ROWS: readonly { level: TrustLevel; label: string; body: string }[] = [
  {
    level: "verified",
    label: "Verified",
    body: "Speaker has institutional credentials and a public scholarly record.",
  },
  {
    level: "unknown",
    label: "Unknown",
    body: "Not enough signals yet to verify this speaker.",
  },
  {
    level: "flagged",
    label: "Flagged",
    body: "Sourcing has been flagged as inaccurate or controversial. Read with caution.",
  },
];

type Props = {
  results: readonly ResearchResult[];
  question: string;
  totalResults: number;
  synthesis: readonly ResearchSynthesisGroup[];
};

function applySpeakerFilter(
  results: readonly ResearchResult[],
  filter: SpeakerFilterValue,
): readonly ResearchResult[] {
  return results.filter((result) => {
    if (filter.blacklist.includes(result.speaker)) return false;
    if (filter.whitelist.length > 0 && !filter.whitelist.includes(result.speaker)) {
      return false;
    }
    if (filter.gate === "verified-only") return result.trust === "verified";
    if (filter.gate === "include-unknown") return result.trust !== "flagged";
    return true;
  });
}

export function Research({ results, question, totalResults, synthesis }: Props) {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [speakerFilter, setSpeakerFilter] = useState<SpeakerFilterValue>(DEFAULT_SPEAKER_FILTER);
  const [speakerFilterOpen, setSpeakerFilterOpen] = useState(false);
  const speakerFilterRef = useRef<HTMLDivElement>(null);
  const [trustHelpOpen, setTrustHelpOpen] = useState(false);
  const trustHelpRef = useRef<HTMLDivElement>(null);

  // Reset the editable draft when the page receives a new question prop
  // (e.g. URL-driven prefill from the command palette). React render-phase
  // reset rather than an effect: cheaper, no extra render, and the lint rule
  // bans setState-in-effect.
  const [lastQuestion, setLastQuestion] = useState(question);
  const [activeQuery, setActiveQuery] = useState(question);
  const [queryDraft, setQueryDraft] = useState(question);
  if (question !== lastQuestion) {
    setLastQuestion(question);
    setActiveQuery(question);
    setQueryDraft(question);
  }

  const deepTimer = useDeepResearchTimer();
  const [deepRevealed, setDeepRevealed] = useState(false);
  const [synthesisOpen, setSynthesisOpen] = useState(true);

  const speakers = useMemo(
    () => [...new Set(results.map((r) => r.speaker))].sort((a, b) => a.localeCompare(b)),
    [results],
  );

  const visibleResults = useMemo(() => {
    const trustFiltered = applySpeakerFilter(results, speakerFilter);
    if (filterType === "all") return trustFiltered;
    return trustFiltered.filter((result) => result.type === filterType);
  }, [results, filterType, speakerFilter]);

  useOnOutsideInteraction(speakerFilterRef, () => setSpeakerFilterOpen(false), {
    enabled: speakerFilterOpen,
  });
  useOnOutsideInteraction(trustHelpRef, () => setTrustHelpOpen(false), {
    enabled: trustHelpOpen,
  });

  function handleRerun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = queryDraft.trim();
    if (trimmed.length === 0 || trimmed === activeQuery) return;
    setActiveQuery(trimmed);
    // In production this would re-fetch results. The mock corpus is fixed,
    // so we just acknowledge the new question by updating the active query.
  }

  function startDeepResearch() {
    deepTimer.start();
    setDeepRevealed(false);
  }

  const queryEdited = queryDraft.trim() !== activeQuery && queryDraft.trim().length > 0;
  const showResults =
    deepTimer.status !== "running" && (deepTimer.status !== "completed" || deepRevealed);
  const showSynthesis = showResults && synthesis.length > 0 && visibleResults.length >= 4;

  return (
    <div className="research">
      <div className="research-inner">
        <header className="research-hd">
          <h1>External research</h1>
          <p className="research-sub">
            Lectures, articles, and videos from the wider scholarly community
          </p>
        </header>

        <form className="research-query" onSubmit={handleRerun} role="search">
          <SearchIcon size={14} className="research-query-ic" />
          <input
            type="text"
            value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)}
            aria-label="Research question"
            className="research-query-input"
            spellCheck={false}
          />
          <button
            type="submit"
            className={clsx("btn", "sm", !queryEdited && "ghost")}
            disabled={!queryEdited}
          >
            Rerun
          </button>
        </form>

        {deepTimer.status === "idle" ? (
          <div className="research-deep-link">
            <button type="button" onClick={startDeepResearch} className="research-deep-link-btn">
              Run deep research <span aria-hidden="true">→</span>
            </button>
            <span className="research-deep-link-hint">
              ~45s · cross-checks citations and gathers a longer report
            </span>
          </div>
        ) : null}

        {deepTimer.status === "running" ? <DeepRunningState /> : null}
        {deepTimer.status === "completed" && !deepRevealed ? (
          <DeepCompletedState onView={() => setDeepRevealed(true)} />
        ) : null}

        {showResults ? (
          <>
            <div className="research-filter-row" role="toolbar" aria-label="Result filters">
              <div className="research-filter-tabs" role="tablist" aria-label="Result type">
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
              </div>
              <div className="research-filter-trailing">
                <div ref={speakerFilterRef} className="research-filter-anchor">
                  <button
                    type="button"
                    className="btn sm ghost"
                    aria-expanded={speakerFilterOpen}
                    aria-haspopup="dialog"
                    onClick={() => setSpeakerFilterOpen((v) => !v)}
                  >
                    <FilterIcon size={12} /> Speakers
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
                <div ref={trustHelpRef} className="research-filter-anchor">
                  <button
                    type="button"
                    className="iconbtn"
                    aria-expanded={trustHelpOpen}
                    aria-haspopup="dialog"
                    aria-label="Trust signals legend"
                    onClick={() => setTrustHelpOpen((v) => !v)}
                  >
                    <QuestionIcon size={13} />
                  </button>
                  {trustHelpOpen ? <TrustHelp /> : null}
                </div>
              </div>
            </div>

            {showSynthesis ? (
              <SynthesisCard
                groups={synthesis}
                totalSources={visibleResults.length}
                open={synthesisOpen}
                onToggle={() => setSynthesisOpen((v) => !v)}
              />
            ) : null}

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
              <div className="research-results">
                {visibleResults.map((result) => (
                  <ResearchCard key={result.id} result={result} />
                ))}
              </div>
            )}

            <div className="research-foot">
              Showing {visibleResults.length} of {totalResults} results.{" "}
              <button type="button" className="research-foot-link">
                Show more
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TrustHelp() {
  return (
    <div role="dialog" aria-label="Trust signals" className="research-trust-help">
      <div className="research-trust-help-title">Trust signals</div>
      <ul>
        {TRUST_ROWS.map((row) => (
          <li key={row.level}>
            <span aria-hidden="true" className={`trust-dot ${row.level}`} />
            <div>
              <strong>{row.label}</strong>
              <span> — {row.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SynthesisProps = {
  groups: readonly ResearchSynthesisGroup[];
  totalSources: number;
  open: boolean;
  onToggle: () => void;
};

function SynthesisCard({ groups, totalSources, open, onToggle }: SynthesisProps) {
  const headline = `Across ${totalSources} sources, ${groups.length} readings emerge`;
  return (
    <section className={clsx("research-synth", open && "open")}>
      <button type="button" className="research-synth-head" onClick={onToggle} aria-expanded={open}>
        <span className="research-synth-headline">{headline}</span>
        <ChevronDownIcon size={13} className="research-synth-chev" />
      </button>
      {open ? (
        <ul className="research-synth-list">
          {groups.map((group) => (
            <li key={group.id} className="research-synth-row">
              <div className="research-synth-row-head">
                <span className="research-synth-row-label">{group.label}</span>
                <span className="research-synth-row-speakers">{group.speakers.join(" · ")}</span>
              </div>
              <p className="research-synth-row-body">{group.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
