export type ResearchType = "lecture" | "article" | "video";
export type TrustLevel = "verified" | "unknown" | "flagged";

export type ResearchResult = {
  id: string;
  type: ResearchType;
  title: string;
  speaker: string;
  trust: TrustLevel;
  source: string;
  year: string | null;
  duration: string | null;
  snippet: string;
  readTimeMinutes: number | null;
};

export type ResearchSynthesisGroup = {
  id: string;
  label: string;
  body: string;
  speakers: readonly string[];
};
