"use client";

import { Fragment } from "react";

import { CopyIcon, PenIcon, SparkleIcon } from "@/components/Icon";
import type { Answer, AnswerParagraph } from "@/types";

import { CitationAnchor } from "./CitationAnchor";

type Props = {
  answer: Answer;
  onFollowUp: () => void;
};

/**
 * Fully-rendered answer: paragraphs (with inline citation anchors), citation
 * list, footer actions and a derived meta line. The v3 layout drops the
 * confidence meter and the "X sources of Y" agreement count.
 *
 * Follow-up is now a real action — clicking it invokes `onFollowUp` from
 * the parent, which collapses the current Q&A into history and resets the
 * input.
 */
export function AnsweredView({ answer, onFollowUp }: Props) {
  const durationSeconds = (answer.durationMs / 1000).toFixed(1);

  return (
    <>
      <div className="answer">
        {answer.paragraphs.map((paragraph, index) => (
          <Paragraph key={index} answer={answer} paragraph={paragraph} />
        ))}
        <p className="closing">{answer.closing}</p>
      </div>

      <div className="cite-list">
        {answer.citations.map((citation) => (
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
        <button type="button" className="btn primary" onClick={onFollowUp}>
          <SparkleIcon size={13} /> Follow-up
        </button>
        <button type="button" className="btn">
          <PenIcon size={13} /> Save to note
        </button>
        <button type="button" className="btn ghost">
          <CopyIcon size={13} /> Copy
        </button>
        <span className="meta" style={{ marginLeft: "auto" }}>
          {answer.citations.length} citations · {durationSeconds}s
        </span>
      </div>
    </>
  );
}

function Paragraph({ paragraph, answer }: { paragraph: AnswerParagraph; answer: Answer }) {
  return (
    <p>
      {paragraph.segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        if (segment.kind === "emphasis") {
          return <em key={index}>{segment.value}</em>;
        }
        const citation = answer.citations.find((c) => c.number === segment.citation);
        if (!citation) {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        return <CitationAnchor key={index} citation={citation} />;
      })}
    </p>
  );
}
