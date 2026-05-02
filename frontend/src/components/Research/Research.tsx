"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";

import { AlertWarnIcon, FilterIcon, QuestionIcon, ShieldIcon } from "@/components/Icon";
import type { ResearchResult, ResearchType } from "@/types";

import { ResearchCard } from "./ResearchCard";

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

export function Research({ results, question, totalResults }: Props) {
  const [filterType, setFilterType] = useState<FilterType>("all");

  const visibleResults = useMemo(() => {
    if (filterType === "all") return results;
    return results.filter((result) => result.type === filterType);
  }, [results, filterType]);

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

        <div className="research-q">
          <QuestionIcon size={14} />
          <span>&ldquo;{question}&rdquo;</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 18,
            flexWrap: "wrap",
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
          <button type="button" className="btn sm ghost">
            <FilterIcon size={12} /> Speaker filters
          </button>
        </div>

        {visibleResults.length === 0 ? (
          <div className="empty">
            <div className="ic-wrap">
              <FilterIcon size={20} />
            </div>
            <div className="ttl">No results in this filter</div>
            <div className="sub">
              Switch back to <strong>All</strong> or try a different format above.
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
      </div>
    </div>
  );
}
