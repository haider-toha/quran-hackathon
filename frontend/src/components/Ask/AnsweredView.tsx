"use client";

import { Fragment } from "react";

import { ConfidenceMeter } from "@/components/ConfidenceMeter";
import { CopyIcon, PenIcon, SparkleIcon } from "@/components/Icon";
import { SAMPLE_ANSWER } from "@/lib/mock-data";
import type { AnswerParagraph } from "@/types";

import { CitationAnchor } from "./CitationAnchor";

/**
 * Fully-rendered answer: confidence header, paragraphs (with inline
 * citation anchors), citation list, footer actions and a derived meta line.
 */
export function AnsweredView() {
  const doneCount = SAMPLE_ANSWER.retrieval.filter((step) => step.status === "done").length;
  const durationSeconds = (SAMPLE_ANSWER.durationMs / 1000).toFixed(1);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <ConfidenceMeter
          level={SAMPLE_ANSWER.confidence.level}
          sources={SAMPLE_ANSWER.confidence.sources}
          total={SAMPLE_ANSWER.confidence.total}
        />
        <span style={{ fontSize: 11.5, color: "var(--color-ink-4)" }}>
          {SAMPLE_ANSWER.confidence.total} tafsirs cited · classical scholarship
        </span>
      </div>

      <div className="answer">
        {SAMPLE_ANSWER.paragraphs.map((paragraph, index) => (
          <Paragraph key={index} paragraph={paragraph} />
        ))}
        <p className="closing">{SAMPLE_ANSWER.closing}</p>
      </div>

      <div className="cite-list">
        {SAMPLE_ANSWER.citations.map((citation) => (
          <div key={citation.number} className="cite-list-item">
            <span className="num">{citation.number}</span>
            <span>
              <span className="name">{citation.source}</span>{" "}
              <span className="who">— {citation.author}</span>
            </span>
            <span className="ref">{citation.ref}</span>
          </div>
        ))}
      </div>

      <div className="answer-foot" style={{ marginTop: 18 }}>
        <button type="button" className="btn primary">
          <SparkleIcon size={13} /> Follow-up
        </button>
        <button type="button" className="btn">
          <PenIcon size={13} /> Save to note
        </button>
        <button type="button" className="btn ghost">
          <CopyIcon size={13} /> Copy
        </button>
        <span className="meta" style={{ marginLeft: "auto" }}>
          {SAMPLE_ANSWER.citations.length} citations · {doneCount} sources · {durationSeconds}s
        </span>
      </div>
    </>
  );
}

function Paragraph({ paragraph }: { paragraph: AnswerParagraph }) {
  return (
    <p>
      {paragraph.segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        if (segment.kind === "emphasis") {
          return <em key={index}>{segment.value}</em>;
        }
        const citation = SAMPLE_ANSWER.citations.find((c) => c.number === segment.citation);
        if (!citation) {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        return <CitationAnchor key={index} citation={citation} />;
      })}
    </p>
  );
}
