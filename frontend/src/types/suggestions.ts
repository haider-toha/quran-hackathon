export type SuggestionKind = "related-verse" | "tafsir-match" | "related-note" | "prompt";
export type SuggestionFeedback = "positive" | "negative" | null;

export type Suggestion = {
  id: string;
  // Stable content hash so the dismissal store can match a suggestion across
  // sessions even when the upstream id changes (re-ranking, re-generation).
  hash: string;
  kind: SuggestionKind;
  reason: string;
  preview: string;
  source: { name: string; ref: string } | null;
  feedback: SuggestionFeedback;
};
