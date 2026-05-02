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
};
