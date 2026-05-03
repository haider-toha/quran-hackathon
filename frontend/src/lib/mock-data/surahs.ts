import type { SurahSummary } from "@/types";

// In v3 the corpus has been narrowed to a single deeply-modeled surah —
// Surat Ad-Duha (93). The catalogue exposes only this entry so the
// SurahPicker, sidebar count, and command palette all reflect the
// intentional single-surah scope. When the corpus expands, the array
// grows; consumers do not change.
export const JUZ_AMMA_SURAHS: readonly SurahSummary[] = [
  {
    number: 93,
    arabic: "الضُّحَى",
    transliteration: "Ad-Duha",
    meaning: "The Forenoon",
    verseCount: 11,
    revelation: "Meccan",
  },
];

export const DEFAULT_SURAH_NUMBER = 93;

export function findSurahSummary(number: number): SurahSummary | undefined {
  return JUZ_AMMA_SURAHS.find((s) => s.number === number);
}
