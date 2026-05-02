export type TafsirLanguage = "Arabic" | "Urdu / English" | "English";

export type TafsirSource = {
  id: string;
  name: string;
  author: string;
  century: string;
  language: TafsirLanguage;
  methodology: string;
  enabledByDefault: boolean;
  isCanonical: boolean;
};

export type TafsirCitation = {
  id: string;
  source: string;
  author: string;
  arabic: string;
  english: string;
};

export type TafsirEntry = {
  ref: string;
  arabic: string;
  translation: string;
  summary: readonly string[];
  takeaways: readonly string[];
  reflection: string;
  citations: readonly TafsirCitation[];
};

export type ResponseMode = "simple" | "detailed" | "comparative";
