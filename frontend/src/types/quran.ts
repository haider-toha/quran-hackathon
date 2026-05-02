export type Revelation = "Meccan" | "Medinan";

export type SurahSummary = {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  verseCount: number;
  revelation: Revelation;
};

export type Verse = {
  number: number;
  arabic: string;
  english: string;
};

export type Surah = SurahSummary & {
  bismillah: string | null;
  juz: number;
  verses: readonly Verse[];
};

export type VerseRef = {
  surah: number;
  ayah: number;
};

export type VerseRange = {
  surah: number;
  start: number;
  end: number;
};
