export type Theme = "light" | "dark";
export type Rooting = "manuscript" | "modern" | "neutral";
export type ReaderMode = "interleaved" | "mushaf" | "translation";
export type ResponseStyle = "brief" | "standard" | "comparative";
export type SuggestionsSurface = "rail" | "off";
export type SuggestionFrequency = "high" | "low" | "off";

export type LastRead = {
  surah: number;
  ayah: number;
  timestamp: number;
} | null;

export type Preferences = {
  // bootstrap / chrome
  theme: Theme;
  rooting: Rooting;
  // onboarding
  onboarded: boolean;
  // tafsir source set (ids matching TAFSIR_SOURCES)
  enabledSources: readonly string[];
  // ai response shape
  responseStyle: ResponseStyle;
  // reader
  readerMode: ReaderMode;
  showReflectionPrompts: boolean;
  recitationEnabled: boolean;
  // writing
  suggestionsSurface: SuggestionsSurface;
  suggestionFrequency: SuggestionFrequency;
  /** When true, the SuggestionsRail body suppresses cards until the user
   * pauses (no keystrokes for 30s) or saves the note. The header count still
   * reflects the real number of available suggestions. */
  reviewOnSave: boolean;
  // continue-from-last-read
  lastRead: LastRead;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "light",
  rooting: "neutral",
  onboarded: false,
  // populate at provider mount from TAFSIR_SOURCES.filter(s=>s.enabledByDefault).map(s=>s.id).
  // Empty here so this module doesn't import mock data and create a circular dep.
  enabledSources: [],
  responseStyle: "standard",
  readerMode: "interleaved",
  showReflectionPrompts: true,
  recitationEnabled: false,
  suggestionsSurface: "rail",
  suggestionFrequency: "high",
  reviewOnSave: false,
  lastRead: null,
};
