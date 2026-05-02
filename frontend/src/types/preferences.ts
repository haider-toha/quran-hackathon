export type Theme = "light" | "dark";
export type Rooting = "manuscript" | "modern" | "neutral";
export type ReaderMode = "mushaf" | "both" | "translation";
export type Suggestions = "margin" | "ghost" | "rail";
export type LibraryView = "cards" | "table";

export type Preferences = {
  theme: Theme;
  rooting: Rooting;
  readerMode: ReaderMode;
  marginalia: boolean;
  recitation: boolean;
  suggestions: Suggestions;
  libraryView: LibraryView;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "light",
  rooting: "neutral",
  readerMode: "both",
  marginalia: false,
  recitation: false,
  suggestions: "ghost",
  libraryView: "table",
};
