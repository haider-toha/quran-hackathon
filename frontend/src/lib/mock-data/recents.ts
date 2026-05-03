export type RecentItem = {
  id: string;
  ref: string;
  title: string;
};

// All recents live inside Surat Aḍ-Ḍuḥā in v3 — the corpus is one surah,
// so cross-surah refs would dead-link. Each entry surfaces in the sidebar
// "Recent" stack and links to the matching note when its title matches a
// note in the corpus.
export const RECENT_ITEMS: readonly RecentItem[] = [
  { id: "r1", ref: "93:3", title: "On grief that comes in waves" },
  { id: "r2", ref: "93:6-8", title: "The orphan and the seeker" },
  { id: "r3", ref: "93:8", title: "Self-sufficient — a careful word" },
  { id: "r4", ref: "93:1-2", title: "Why dawn and night together" },
  { id: "r5", ref: "93:5", title: "La-sawfa — the unhurried promise" },
  { id: "r6", ref: "93:11", title: "Tested by ease, not by hardship" },
];
