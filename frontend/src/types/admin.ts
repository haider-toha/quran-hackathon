export type FeatureFlags = {
  slashCommands: boolean;
  suggestionsRail: boolean;
  deepResearch: boolean;
  recitation: boolean;
  notesExport: boolean;
  deleteAccount: boolean;
  // Admin-only states surfaced in DemoStateBar (e.g. force the Ask deferral
  // path even when the canned answer is high-confidence).
  adminAskStateLow: boolean;
};
