import type { Surah } from "@/types";

import { AD_DUHA } from "./ad-duha";

export { JUZ_AMMA_SURAHS, DEFAULT_SURAH_NUMBER, findSurahSummary } from "./surahs";
export { AD_DUHA } from "./ad-duha";
export { TAFSIR_AD_DUHA, TAFSIR_93_3 } from "./tafsir-ad-duha";
export { SAMPLE_NOTES, FEATURED_NOTE_ID, findNote } from "./notes";
export { SAMPLE_SUGGESTIONS, suggestionsFor } from "./suggestions";
export { SAMPLE_RESEARCH, RESEARCH_QUESTION, RESEARCH_TOTAL_RESULTS } from "./research";
export { TAFSIR_SOURCES } from "./tafsir-sources";
export { TEMPLATES } from "./templates";
export {
  ASK_SCENARIOS,
  SAMPLE_ANSWER,
  SAMPLE_DEFERRAL,
  SAMPLE_QUESTION,
  STREAMING_RETRIEVAL,
  STREAMING_TEXT,
  defaultVariantFor,
  findScenario,
} from "./sample-answer";
export type { RecentItem } from "./recents";
export { RECENT_ITEMS } from "./recents";

// In v3 the corpus is intentionally one surah — Ad-Duha (93). The
// catalogue type and `findSurah` lookup keep their shape so that
// expanding the corpus later does not change call-site code.
export const JUZ_AMMA_SURAH_DATA: Readonly<Record<number, Surah>> = {
  93: AD_DUHA,
};

export function findSurah(number: number): Surah | undefined {
  return JUZ_AMMA_SURAH_DATA[number];
}
