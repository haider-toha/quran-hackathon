import type { Note } from "@/types";

export const SAMPLE_NOTES: readonly Note[] = [
  {
    id: "n1",
    title: "On grief that comes in waves",
    preview:
      "The verse reframes silence — the pause in revelation was not absence but preparation. There's something here about how grief teaches the same lesson, except we resist it.",
    body: GRIEF_BODY(),
    link: "93:3",
    tags: ["grief", "tawakkul", "patience"],
    editedRelative: "4m ago",
    editedAbsolute: "2 May, 18:42",
    editedAt: "2026-05-02T18:42:00Z",
    hasAi: true,
  },
  {
    id: "n2",
    title: "The orphan and the seeker",
    preview:
      "Three findings, three responses. A pattern that maps onto how God meets every kind of lack — material, spiritual, situational. The fact that the verse uses the past tense 'found' is itself…",
    body: "",
    link: "93:6-8",
    tags: ["mercy", "pattern"],
    editedRelative: "2h ago",
    editedAbsolute: "2 May, 16:10",
    editedAt: "2026-05-02T16:10:00Z",
    hasAi: false,
  },
  {
    id: "n3",
    title: "What does it mean to be self-sufficient?",
    preview:
      "Aghnā doesn't mean wealthy in the way modern English implies. It's closer to 'no longer in need' — a sufficiency, not an accumulation. This distinction matters enormously when reading verse 8.",
    body: "",
    link: "93:8",
    tags: ["contentment", "language"],
    editedRelative: "yesterday",
    editedAbsolute: "1 May, 21:30",
    editedAt: "2026-05-01T21:30:00Z",
    hasAi: false,
  },
  {
    id: "n4",
    title: "Why dawn and night together",
    preview:
      "The oath pairs ḍuḥā and layl — brightness and stillness. Reading As-Saʿdī, I see he reads them as opposites that both belong to the same hand. The point isn't 'good times and bad times'…",
    body: "",
    link: "93:1-2",
    tags: ["contemplation", "oaths"],
    editedRelative: "yesterday",
    editedAbsolute: "1 May, 14:18",
    editedAt: "2026-05-01T14:18:00Z",
    hasAi: false,
  },
  {
    id: "n5",
    title: "Tested by ease, not by hardship",
    preview:
      "The challenge of verse 11 — proclaiming the favor — is harder than enduring the trial. Hardship breaks pride; ease grows it. A note for the next time things go well.",
    body: "",
    link: "93:11",
    tags: ["gratitude", "humility"],
    editedRelative: "3 days ago",
    editedAbsolute: "29 Apr, 09:02",
    editedAt: "2026-04-29T09:02:00Z",
    hasAi: false,
  },
  {
    id: "n6",
    title: "Reading 'qalā' carefully",
    preview:
      "The word qalā is heat — not mere displeasure, but a flaring inside the chest. To negate it so explicitly is to say: not even a flicker of that exists between you and your Lord.",
    body: "",
    link: "93:3",
    tags: ["language", "mercy"],
    editedRelative: "3 days ago",
    editedAbsolute: "29 Apr, 16:45",
    editedAt: "2026-04-29T16:45:00Z",
    hasAi: false,
  },
  {
    id: "n7",
    title: "When something doesn't come",
    preview:
      "There's a quietly devastating implication in verse 5: some things are coming. Not all at once. We are being given according to a calendar we don't see. The right response to delay is not…",
    body: "",
    link: "93:5",
    tags: ["patience", "tawakkul"],
    editedRelative: "5 days ago",
    editedAbsolute: "27 Apr, 22:11",
    editedAt: "2026-04-27T22:11:00Z",
    hasAi: false,
  },
  {
    id: "n8",
    title: "Three findings — a structure",
    preview:
      "Verses 6, 7, 8 each open with wajadaka. The repetition is rhetorical but also theological: God finding the human is the precondition for everything else.",
    body: "",
    link: "93:6-8",
    tags: ["pattern", "structure"],
    editedRelative: "1 week ago",
    editedAbsolute: "24 Apr, 12:30",
    editedAt: "2026-04-24T12:30:00Z",
    hasAi: false,
  },
];

function GRIEF_BODY(): string {
  return [
    "I keep returning to verse 3. The Arabic doesn't say \"your Lord is still here,\" which is what I'd want to hear in the bad hours. It says *he has not bid you farewell*. The negation is shaped to the specific fear I'm carrying — not the fear of God's distance, but the fear that the relationship itself ended without me noticing.",
    "",
    "## What the silence is, and isn't",
    "",
    "As-Saʿdī reads the pause as deliberate — preparation, not punishment. He uses the word *tarbiyya*, nurturing, the kind a parent does when they step back so the child can take a step alone. That's a different category of silence than I was carrying.",
    "",
    "> Your Lord has not left you, O Muḥammad, nor has He hated you.",
    "> — Tafsir Ibn Kathīr, on 93:3",
    "",
    "What I want to remember: **silence is not the same as abandonment.** The verse states this directly. It is the kind of sentence you can put on a wall.",
  ].join("\n");
}

export function findNote(id: string): Note | undefined {
  return SAMPLE_NOTES.find((n) => n.id === id);
}

export const FEATURED_NOTE_ID = "n1";
