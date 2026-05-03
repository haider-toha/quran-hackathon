"use client";

import { Fragment, useCallback, useMemo } from "react";

import { CopyIcon, PenIcon } from "@/components/Icon";
import { type AnswerViewMode, setThreadAnswerView, useThread } from "@/lib/chat-store";
import { copyToClipboard } from "@/lib/clipboard";
import { setActiveCitation } from "@/lib/context-panel-store";
import { showToast } from "@/lib/toast-store";
import type { Answer, AnswerCitation, AnswerParagraph } from "@/types";

import { AnswerViewToggle } from "./AnswerViewToggle";
import { BySourceView } from "./BySourceView";
import { CitationAnchor } from "./CitationAnchor";
import { ConfidenceLabel, levelToState } from "./ConfidenceLabel";
import { SourcesConsultedFooter } from "./SourcesConsultedFooter";

type Props = {
  answer: Answer;
  // The active thread id is the persistence key for the answer-view
  // preference (synthesized vs. by-source). When `null` the toggle still
  // renders but defaults to "synthesized" and the choice is ephemeral —
  // this is mostly the demo-bar / inflight surfaces where there's no
  // backing thread yet.
  threadId?: string | null;
};

function paragraphToText(paragraph: AnswerParagraph): string {
  return paragraph.segments
    .map((segment) => {
      if (segment.kind === "cite") return `${segment.value} [${segment.citation}]`;
      return segment.value;
    })
    .join("");
}

/**
 * Fully-rendered answer: paragraphs (with inline citation anchors), citation
 * list, footer actions and a derived meta line. The v3 layout drops the
 * confidence meter and the "X sources of Y" agreement count. Follow-up was
 * removed when Ask moved to a persistent chat-thread model — the input is
 * always visible at the bottom, so a separate "ask another" affordance is
 * redundant.
 */
export function AnsweredView({ answer, threadId = null }: Props) {
  const durationSeconds = (answer.durationMs / 1000).toFixed(1);
  const confidenceState = levelToState(answer.confidence.level);
  // Number of unique sources actually cited — what feeds the "Grounded
  // in N sources" copy. Distinct from `answer.confidence.sources`, which
  // is the server-side agreement count.
  const uniqueCitedSources = useMemo<number>(() => {
    const set = new Set<string>();
    for (const c of answer.citations) set.add(c.source);
    return set.size;
  }, [answer.citations]);

  // Per-conversation answer-view preference (Phase 7). The thread row in
  // chat-store carries `preferences.answerView`; reading it via
  // `useThread` keeps the toggle reactive to writes from anywhere
  // (including the `/compare` slash command).
  const thread = useThread(threadId);
  const answerView: AnswerViewMode = thread?.preferences.answerView ?? "synthesized";
  const handleViewChange = useCallback(
    (next: AnswerViewMode) => {
      if (threadId) setThreadAnswerView(threadId, next);
    },
    [threadId],
  );

  const handleCopy = useCallback(async () => {
    const lines: string[] = [`Q: ${answer.question}`, ""];
    for (const p of answer.paragraphs) lines.push(paragraphToText(p), "");
    if (answer.closing) lines.push(answer.closing, "");
    if (answer.citations.length > 0) {
      lines.push("Citations");
      for (const c of answer.citations) {
        lines.push(`[${c.number}] ${c.source} — ${c.author}, ${c.ref}`);
      }
    }
    const ok = await copyToClipboard(lines.join("\n").trim());
    showToast(ok ? "Copied answer" : "Couldn't copy answer", {
      variant: ok ? "success" : "error",
    });
  }, [answer]);

  return (
    <>
      <div className="answer-head">
        <ConfidenceLabel state={confidenceState} uniqueSources={uniqueCitedSources} />
        <AnswerViewToggle value={answerView} onChange={handleViewChange} />
      </div>

      {answerView === "by-source" ? (
        <BySourceView answer={answer} />
      ) : (
        <>
          <div className="answer">
            {answer.paragraphs.map((paragraph, index) => (
              <Paragraph
                key={`p-${index}-${paragraph.segments.length}`}
                answer={answer}
                paragraph={paragraph}
              />
            ))}
            <p className="closing">{answer.closing}</p>
          </div>

          <div className="cite-list">
            {answer.citations.map((citation) => (
              <CitationListItem key={citation.number} citation={citation} />
            ))}
          </div>
        </>
      )}

      <SourcesConsultedFooter answer={answer} />

      <div className="answer-foot" style={{ marginTop: 18 }}>
        <button type="button" className="btn">
          <PenIcon size={13} /> Save to note
        </button>
        <button type="button" className="btn ghost" onClick={handleCopy}>
          <CopyIcon size={13} /> Copy
        </button>
        <span className="meta" style={{ marginLeft: "auto" }}>
          {answer.citations.length} citations · {durationSeconds}s
        </span>
      </div>
    </>
  );
}

// Citation-list rows act as anchors too — clicking opens the right-hand
// ContextPanel scrolled to the cited passage. Mirrors the inline anchor
// behaviour so the user can reach the same destination from either spot.
function CitationListItem({ citation }: { citation: AnswerCitation }) {
  const handleClick = useCallback(() => {
    setActiveCitation(citation);
  }, [citation]);
  return (
    <button type="button" className="cite-list-item" onClick={handleClick}>
      <span className="num">{citation.number}</span>
      <span>
        <span className="name">{citation.source}</span>{" "}
        <span className="who">— {citation.author}</span>
      </span>
      <span className="ref">{citation.ref}</span>
    </button>
  );
}

function Paragraph({ paragraph, answer }: { paragraph: AnswerParagraph; answer: Answer }) {
  return (
    <p>
      {paragraph.segments.map((segment, index) => {
        // Composite keys: kind + position is unique per paragraph and stable
        // across renders because answer paragraphs are immutable.
        const key = `${segment.kind}-${index}`;
        if (segment.kind === "text") {
          return <Fragment key={key}>{segment.value}</Fragment>;
        }
        if (segment.kind === "emphasis") {
          return <em key={key}>{segment.value}</em>;
        }
        const citation = answer.citations.find((c) => c.number === segment.citation);
        if (!citation) {
          return <Fragment key={key}>{segment.value}</Fragment>;
        }
        return <CitationAnchor key={`${key}-${citation.number}`} citation={citation} />;
      })}
    </p>
  );
}
