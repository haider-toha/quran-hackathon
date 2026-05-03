// Per-note suggestion seed data. In the real implementation these would
// stream from the backend as the user writes. For v3 we hand-author 3-5
// suggestions per "featured" note across the four kinds — related-verse,
// tafsir-match, related-note, prompt — using real refs and source names
// from the Aḍ-Ḍuḥā corpus.
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
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:5" },
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
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:7" },
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
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:8" },
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

const N4: readonly Suggestion[] = [
  {
    id: "n4-related-93-1",
    hash: "n4:related-verse:93:1",
    kind: "related-verse",
    reason: "Your note pairs ḍuḥā and layl — start from the first oath",
    preview: "“By the morning brightness…” — the first half of the surah's opening pair.",
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:1" },
    feedback: null,
  },
  {
    id: "n4-tafsir-saadi-pairing",
    hash: "n4:tafsir-match:saadi:pairing",
    kind: "tafsir-match",
    reason: "A tafsir passage that matches your reading of the pairing",
    preview:
      "As-Saʿdī reads ḍuḥā and layl as opposites that both belong to the same hand — the same pairing you noticed.",
    source: { name: "Tafsir As-Saʿdī", ref: "93:1-2" },
    feedback: null,
  },
  {
    id: "n4-prompt-pairing",
    hash: "n4:prompt:opposites",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview: "What other oppositions in your life are actually one rhythm in disguise?",
    source: null,
    feedback: null,
  },
];

const N5: readonly Suggestion[] = [
  {
    id: "n5-related-93-3",
    hash: "n5:related-verse:93:3",
    kind: "related-verse",
    reason: "Your letter is anchored on this verse",
    preview: "“Your Lord has neither forsaken you nor does He hate you.”",
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:3" },
    feedback: null,
  },
  {
    id: "n5-related-note-grief",
    hash: "n5:related-note:grief",
    kind: "related-note",
    reason: "A past note touches the same theme",
    preview: "“On grief that comes in waves” — your earlier reflection on dryness and tarbiyya.",
    source: { name: "Note", ref: "n1" },
    feedback: null,
  },
  {
    id: "n5-tafsir-qurtubi-duration",
    hash: "n5:tafsir-match:qurtubi:duration",
    kind: "tafsir-match",
    reason: "A tafsir passage you might add to the letter",
    preview:
      "Al-Qurṭubī gives fifteen days as the majority position; some narrate forty. The duration is contested — that may itself be the point.",
    source: { name: "Tafsir al-Qurṭubī", ref: "93:1" },
    feedback: null,
  },
  {
    id: "n5-prompt-future-self",
    hash: "n5:prompt:future-self",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview:
      "What else would you want this letter to remind you, when you re-read it on a hard day?",
    source: null,
    feedback: null,
  },
];

const N6: readonly Suggestion[] = [
  {
    id: "n6-related-93-3",
    hash: "n6:related-verse:93:3",
    kind: "related-verse",
    reason: "The verse where qalā is negated",
    preview: "“…nor does He hate you.” — the second negation in 93:3.",
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:3" },
    feedback: null,
  },
  {
    id: "n6-tafsir-kathir-qala",
    hash: "n6:tafsir-match:kathir:qala",
    kind: "tafsir-match",
    reason: "A tafsir passage that matches your reading",
    preview:
      "Ibn Kathīr glosses qalā as active dislike, not mere distance — exactly the heat you described.",
    source: { name: "Tafsir Ibn Kathīr", ref: "93:3" },
    feedback: null,
  },
  {
    id: "n6-prompt-flicker",
    hash: "n6:prompt:not-a-flicker",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview:
      "If even a flicker of qalā is denied, what does that tell you about how to read the silences in your prayer life?",
    source: null,
    feedback: null,
  },
];

const N7: readonly Suggestion[] = [
  {
    id: "n7-related-93-5",
    hash: "n7:related-verse:93:5",
    kind: "related-verse",
    reason: "The verse you're reading from",
    preview: "“And your Lord is going to give you, and you will be satisfied.”",
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:5" },
    feedback: null,
  },
  {
    id: "n7-tafsir-saadi-la-sawfa",
    hash: "n7:tafsir-match:saadi:la-sawfa",
    kind: "tafsir-match",
    reason: "A tafsir passage you haven't cited",
    preview:
      "As-Saʿdī notes that the gift in la-sawfa is left without a noun — and that the open-endedness is itself the gift.",
    source: { name: "Tafsir As-Saʿdī", ref: "93:5" },
    feedback: null,
  },
  {
    id: "n7-prompt-calendar",
    hash: "n7:prompt:calendar",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview: "What in your life is on a calendar you don't see?",
    source: null,
    feedback: null,
  },
];

const N8: readonly Suggestion[] = [
  {
    id: "n8-related-93-6",
    hash: "n8:related-verse:93:6",
    kind: "related-verse",
    reason: "The first wajadaka clause",
    preview: "“Did He not find you an orphan and shelter you?”",
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:6" },
    feedback: null,
  },
  {
    id: "n8-related-note-orphan",
    hash: "n8:related-note:orphan",
    kind: "related-note",
    reason: "A note in your library on the same structure",
    preview:
      "“The orphan and the seeker” — your earlier reflection on the same three-finding pattern.",
    source: { name: "Note", ref: "n2" },
    feedback: null,
  },
  {
    id: "n8-prompt-finding",
    hash: "n8:prompt:finding-vs-fixing",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview:
      "What is the difference between God *finding* a lack and *fixing* it — in your own life?",
    source: null,
    feedback: null,
  },
];

const N9: readonly Suggestion[] = [
  {
    id: "n9-related-93-5",
    hash: "n9:related-verse:93:5",
    kind: "related-verse",
    reason: "The verse under comparison",
    preview: "“And your Lord is going to give you, and you will be satisfied.”",
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:5" },
    feedback: null,
  },
  {
    id: "n9-tafsir-tabari-arja",
    hash: "n9:tafsir-match:tabari:arja-aya",
    kind: "tafsir-match",
    reason: "A tafsir line that strengthens the third commentary",
    preview:
      "Aṭ-Ṭabarī (cited by al-Qurṭubī): “This is the most hopeful verse in the Book of God.”",
    source: { name: "Tafsir aṭ-Ṭabarī (via al-Qurṭubī)", ref: "93:5" },
    feedback: null,
  },
  {
    id: "n9-prompt-converge",
    hash: "n9:prompt:converge-diverge",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview:
      "Where do the three readings converge, where do they diverge — and which gap matters most to you?",
    source: null,
    feedback: null,
  },
];

const N10: readonly Suggestion[] = [
  {
    id: "n10-related-93-10",
    hash: "n10:related-verse:93:10",
    kind: "related-verse",
    reason: "The verse you're reading from",
    preview: "“And as for the petitioner, do not repel him.”",
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:10" },
    feedback: null,
  },
  {
    id: "n10-tafsir-saadi-saaiil",
    hash: "n10:tafsir-match:saadi:sail",
    kind: "tafsir-match",
    reason: "A tafsir passage you haven't cited",
    preview:
      "As-Saʿdī widens sāʾil to include both the asker for wealth and the asker for knowledge — your note touches the second.",
    source: { name: "Tafsir As-Saʿdī", ref: "93:10" },
    feedback: null,
  },
  {
    id: "n10-prompt-tone",
    hash: "n10:prompt:tone-not-content",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview:
      "Recall the last time you said no to a request. What was your tone, even when your answer was correct?",
    source: null,
    feedback: null,
  },
];

const N14: readonly Suggestion[] = [
  {
    id: "n14-tafsir-bukhari-4983",
    hash: "n14:tafsir-match:bukhari-4983",
    kind: "tafsir-match",
    reason: "The hadith your note centers on",
    preview:
      "Bukhārī 4983 (Jundub): “I see only that your shayṭān has bid you farewell.” The Quran answers her in her vocabulary two verses later.",
    source: { name: "Ṣaḥīḥ al-Bukhārī", ref: "4983" },
    feedback: null,
  },
  {
    id: "n14-related-93-3",
    hash: "n14:related-verse:93:3",
    kind: "related-verse",
    reason: "The verse the hadith leads into",
    preview: "“Your Lord has neither forsaken you nor does He hate you.”",
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:3" },
    feedback: null,
  },
  {
    id: "n14-prompt-vocab",
    hash: "n14:prompt:answered-in-her-vocab",
    kind: "prompt",
    reason: "A reflection question you might explore",
    preview:
      "What does it mean that the Quran negates the exact word the taunter chose? What is being modeled there?",
    source: null,
    feedback: null,
  },
];

// Default seed for any note id not enumerated above. Keeps the rail
// useful even on user-created notes during the v3 mock.
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
    source: { name: "Surat Aḍ-Ḍuḥā", ref: "93:3" },
    feedback: null,
  },
];

export const SAMPLE_SUGGESTIONS: Readonly<Record<string, readonly Suggestion[]>> = {
  n1: N1,
  n2: N2,
  n3: N3,
  n4: N4,
  n5: N5,
  n6: N6,
  n7: N7,
  n8: N8,
  n9: N9,
  n10: N10,
  n14: N14,
};

export function suggestionsFor(noteId: string): readonly Suggestion[] {
  return SAMPLE_SUGGESTIONS[noteId] ?? DEFAULT;
}
