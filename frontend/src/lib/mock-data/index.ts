import type { Surah } from "@/types";

import { AD_DUHA } from "./ad-duha";
import { AL_ASR } from "./al-asr";
import { AL_IKHLAS } from "./al-ikhlas";
import { AL_KAWTHAR } from "./al-kawthar";
import { AL_QADR } from "./al-qadr";
import { AN_NABA } from "./an-naba";
import { ASH_SHARH } from "./ash-sharh";
import { AT_TIN } from "./at-tin";
import { AZ_ZALZALA } from "./az-zalzala";

export { JUZ_AMMA_SURAHS, DEFAULT_SURAH_NUMBER, findSurahSummary } from "./surahs";
export { AD_DUHA } from "./ad-duha";
export { AL_ASR } from "./al-asr";
export { AL_IKHLAS } from "./al-ikhlas";
export { AL_KAWTHAR } from "./al-kawthar";
export { AL_QADR } from "./al-qadr";
export { AN_NABA } from "./an-naba";
export { ASH_SHARH } from "./ash-sharh";
export { AT_TIN } from "./at-tin";
export { AZ_ZALZALA } from "./az-zalzala";
export { TAFSIR_93_3 } from "./tafsir-93-3";
export { SAMPLE_NOTES, FEATURED_NOTE_ID, findNote } from "./notes";
export { SAMPLE_SUGGESTIONS, suggestionsFor } from "./suggestions";
export { SAMPLE_RESEARCH, RESEARCH_QUESTION, RESEARCH_TOTAL_RESULTS } from "./research";
export { TAFSIR_SOURCES } from "./tafsir-sources";
export {
  SAMPLE_ANSWER,
  SAMPLE_DEFERRAL,
  SAMPLE_QUESTION,
  STREAMING_RETRIEVAL,
  STREAMING_TEXT,
} from "./sample-answer";
export type { RecentItem } from "./recents";
export { RECENT_ITEMS } from "./recents";

export const JUZ_AMMA_SURAH_DATA: Readonly<Record<number, Surah>> = {
  78: AN_NABA,
  93: AD_DUHA,
  94: ASH_SHARH,
  95: AT_TIN,
  97: AL_QADR,
  99: AZ_ZALZALA,
  103: AL_ASR,
  108: AL_KAWTHAR,
  112: AL_IKHLAS,
};

export function findSurah(number: number): Surah | undefined {
  return JUZ_AMMA_SURAH_DATA[number];
}
