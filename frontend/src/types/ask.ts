export type AskState = "idle" | "streaming" | "answered" | "low";

export type ConfidenceLevel = "high" | "med" | "low";

export type RetrievalStatus = "pending" | "active" | "done";

export type RetrievalStep = {
  source: string;
  status: RetrievalStatus;
  meta: string;
};

export type AnswerCitation = {
  number: number;
  source: string;
  author: string;
  ref: string;
  arabic: string;
  english: string;
};

export type AnswerSegment =
  | { kind: "text"; value: string }
  | { kind: "emphasis"; value: string }
  | { kind: "cite"; value: string; citation: number };

export type AnswerParagraph = {
  segments: readonly AnswerSegment[];
};

export type Answer = {
  question: string;
  scope: string;
  paragraphs: readonly AnswerParagraph[];
  closing: string;
  citations: readonly AnswerCitation[];
  retrieval: readonly RetrievalStep[];
  confidence: {
    level: ConfidenceLevel;
    sources: number;
    total: number;
  };
  durationMs: number;
};

export type Deferral = {
  question: string;
  scope: string;
  retrieval: readonly RetrievalStep[];
  confidence: {
    level: ConfidenceLevel;
    sources: number;
    total: number;
  };
  body: readonly string[];
};
