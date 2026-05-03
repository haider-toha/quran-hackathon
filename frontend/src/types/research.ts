export type ResearchType = "lecture" | "article" | "video";
export type TrustLevel = "verified" | "unknown" | "flagged";

export type ResearchResult = {
  id: string;
  type: ResearchType;
  title: string;
  speaker: string;
  trust: TrustLevel;
  meta: string;
  duration: string | null;
  snippet: string;
  // Optional thumbnail URL for video-type results. Wave 2F adds this for the
  // result-type-icon affordance — videos render the thumbnail when present;
  // a placeholder otherwise. Articles and lectures default to null.
  thumbnailUrl: string | null;
  // Estimated read time in minutes for article-type results. Lectures and
  // videos use `duration` instead; for them this is null.
  readTimeMinutes: number | null;
};
