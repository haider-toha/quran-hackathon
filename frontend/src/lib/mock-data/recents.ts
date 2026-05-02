export type RecentItem = {
  id: string;
  ref: string;
  title: string;
};

export const RECENT_ITEMS: readonly RecentItem[] = [
  { id: "r1", ref: "93:3", title: "On grief that comes in waves" },
  { id: "r2", ref: "93:6-8", title: "The orphan and the seeker" },
  { id: "r3", ref: "93:8", title: "Self-sufficient — a careful word" },
  { id: "r4", ref: "93:1-2", title: "Why dawn and night together" },
  { id: "r5", ref: "94:5", title: "With every difficulty…" },
];
