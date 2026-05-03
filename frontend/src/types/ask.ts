// "input" is the v3 default — the user has typed nothing yet, no answer is
// rendered. "low" is the deferral state. "idle" is retained for legacy demo
// callers; the active set in v3 is "input | streaming | answered | low".
export type AskState = "idle" | "input" | "streaming" | "answered" | "low";

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
  // The deferral surface still receives confidence from the server; the v3
  // UI does not render a meter, but the field stays so deferral logic can
  // route on it.
  confidence: {
    level: ConfidenceLevel;
    sources: number;
    total: number;
  };
  durationMs: number;
};

// Concrete next-step suggestion shown beneath a deferred answer. The
// model proposes a small set of "what would unstick this question"
// actions — e.g. enabling another tafsir source or widening scope.
// `kind` is a discriminator the UI uses to pick an icon and tone; the
// label is what's actually rendered on the button.
export type DeferralNextStepKind = "enable-source" | "widen-scope" | "rephrase" | "external";

export type DeferralNextStep = {
  kind: DeferralNextStepKind;
  label: string;
  // When the mock has a target source it's stashed here so the UI can
  // surface "Enable Tafsir al-Razi" rather than a generic prompt.
  target?: string;
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
  // Optional concrete suggestions the model thinks would help. Surfaced
  // as small action buttons under the deferral body.
  nextSteps?: readonly DeferralNextStep[];
};

// Scenario / variant types let mock data carry several phrasings of the
// same underlying question — the canonical phrasing plus user-shaped
// variants (terse, shorthand, partial, ambiguous) — alongside the
// expected outcome (answer or low-confidence deferral). The demo state
// bar reads `ASK_SCENARIOS` to cycle between them, and the existing
// streaming/answered/low surfaces consume the variant's outcome.
export type AskIntent =
  | "direct"
  | "personal-application"
  | "historical-context"
  | "linguistic"
  | "comparative"
  | "speculative"
  | "off-scope";

export type AskScenarioOutcome =
  | { kind: "answer"; answer: Answer }
  | { kind: "deferral"; deferral: Deferral };

export type AskScenarioVariant = {
  id: string;
  phrasing: string;
  intent: AskIntent;
  // One-line note on what makes this variant interesting — partial input,
  // ambiguous referent, off-scope, etc. Surfaces in the demo bar tooltip.
  edge: string | null;
  outcome: AskScenarioOutcome;
};

export type AskScenario = {
  id: string;
  title: string;
  canonicalQuestion: string;
  variants: readonly AskScenarioVariant[];
};
