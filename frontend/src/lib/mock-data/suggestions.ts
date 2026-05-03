// Mock per-note suggestion seed data. In the real implementation these would
// stream from the backend as the user writes. For v3 we hand-author 3-5
// suggestions per "featured" note across the four kinds — related-verse,
// tafsir-match, related-note, prompt — using real refs and source names.
//
// `hash` is a stable content fingerprint so the dismissal store can identify
// a suggestion across sessions even when its surface position changes.

import type { Suggestion } from "@/types";

const N1: readonly Suggestion[] = [
  {
    id: "n1-related-93-5",
    hash: "n1:related-verse:93:5",
    kind: "related-verse",
    reason: "You wrote about silence — the next verse may answer it",
    preview:
      "“And your Lord is going to give you, and you will be satisfied.” — the verse that follows the negation in 93:3.",
    source: { name: "Surat Ad-Ḍuḥā", ref: "93:5" },
    feedback: null,
  },
  {
    id: "n1-tafsir-saadi-tarbiyya",
    hash: "n1:tafsir-match:as-saadi:tarbiyya",
    kind: "tafsir-match",
    reason: "A tafsir passage you haven't cited matches your wording",
    preview:
      "As-Saʿdī uses tarbiyya here — the same word you reached for. He frames the pause as nurturing, not absence.",
    source: { name: "Tafsir As-Saʿdī", ref: "93:3" },
    feedback: null,
  },
  {
    id: "n1-related-note-qala",
    hash: "n1:related-note:qala",
    kind: "related-note",
    reason: "Your past note discusses the same theme",
    preview: "“Reading ‘qalā’ carefully” — your earlier note explores the same word you used here.",
    source: { name: "Note", ref: "n6" },
    feedback: null,
  },
  {
    id: "n1-prompt-silence",
    hash: "n1:prompt:silence",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview: "What does the silence in your own life teach you that words cannot?",
    source: null,
    feedback: null,
  },
  {
    id: "n1-tafsir-ibn-kathir",
    hash: "n1:tafsir-match:ibn-kathir:wadda-aka",
    kind: "tafsir-match",
    reason: "A tafsir passage you haven't cited matches your wording",
    preview:
      "Ibn Kathīr reads waddaʿaka as the formal goodbye — to negate it is to deny that any farewell occurred at all.",
    source: { name: "Tafsir Ibn Kathīr", ref: "93:3" },
    feedback: null,
  },
];

const N2: readonly Suggestion[] = [
  {
    id: "n2-related-93-7",
    hash: "n2:related-verse:93:7",
    kind: "related-verse",
    reason: "You wrote about being found — verse 7 carries the second finding",
    preview: "“And He found you lost and guided you.” — second of the three wajadaka clauses.",
    source: { name: "Surat Ad-Ḍuḥā", ref: "93:7" },
    feedback: null,
  },
  {
    id: "n2-tafsir-three-findings",
    hash: "n2:tafsir-match:saadi:three-findings",
    kind: "tafsir-match",
    reason: "A tafsir passage you haven't cited matches your wording",
    preview:
      "As-Saʿdī links the three findings to three kinds of lack — material, situational, spiritual — each met directly.",
    source: { name: "Tafsir As-Saʿdī", ref: "93:6-8" },
    feedback: null,
  },
  {
    id: "n2-prompt-pattern",
    hash: "n2:prompt:pattern-of-finding",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview: "Which of the three findings most resembles the situation you are reading from today?",
    source: null,
    feedback: null,
  },
];

const N3: readonly Suggestion[] = [
  {
    id: "n3-related-93-8",
    hash: "n3:related-verse:93:8",
    kind: "related-verse",
    reason: "You wrote about sufficiency — verse 8 names it",
    preview: "“And He found you in need and made you self-sufficient.”",
    source: { name: "Surat Ad-Ḍuḥā", ref: "93:8" },
    feedback: null,
  },
  {
    id: "n3-tafsir-aghna",
    hash: "n3:tafsir-match:qurtubi:aghna",
    kind: "tafsir-match",
    reason: "A tafsir passage you haven't cited matches your wording",
    preview: "Al-Qurṭubī glosses aghnā as “no longer in need,” closer to contentment than wealth.",
    source: { name: "Tafsir Al-Qurṭubī", ref: "93:8" },
    feedback: null,
  },
  {
    id: "n3-prompt-self-sufficient",
    hash: "n3:prompt:self-sufficient",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview:
      "Where in your life would you say you are sufficient — not wealthy, just no longer in need?",
    source: null,
    feedback: null,
  },
];

// Default seed for any note id not enumerated above. Keeps the rail useful
// even on user-created notes during the v3 mock.
const DEFAULT: readonly Suggestion[] = [
  {
    id: "default-prompt",
    hash: "default:prompt:where-i-am",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview: "What is this note really asking — and what would you do if it were answered?",
    source: null,
    feedback: null,
  },
  {
    id: "default-related-93-3",
    hash: "default:related-verse:93:3",
    kind: "related-verse",
    reason: "A verse to sit with",
    preview: "“Your Lord has not forsaken you, nor does He hate you.”",
    source: { name: "Surat Ad-Ḍuḥā", ref: "93:3" },
    feedback: null,
  },
];

export const SAMPLE_SUGGESTIONS: Readonly<Record<string, readonly Suggestion[]>> = {
  n1: N1,
  n2: N2,
  n3: N3,
};

export function suggestionsFor(noteId: string): readonly Suggestion[] {
  return SAMPLE_SUGGESTIONS[noteId] ?? DEFAULT;
}
