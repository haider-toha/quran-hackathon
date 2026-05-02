import type { Answer, Deferral, RetrievalStep } from "@/types";

export const SAMPLE_QUESTION =
  "What does it mean that God 'has not forsaken' the Prophet ﷺ — and how should I read that when my own prayer feels unanswered?";

export const SAMPLE_ANSWER: Answer = {
  question: SAMPLE_QUESTION,
  scope: "Ad-Ḍuḥā 93:1–11",
  paragraphs: [
    {
      segments: [
        { kind: "text", value: "The phrase " },
        { kind: "emphasis", value: "mā waddaʿaka rabbuka" },
        {
          kind: "text",
          value: ' — "your Lord has not forsaken you" — uses a verb (',
        },
        { kind: "emphasis", value: "waddaʿa" },
        {
          kind: "text",
          value:
            ') whose ordinary use is parting between two who love each other. The classical commentators read this carefully: the negation is not just "God hasn\'t left," it\'s "God hasn\'t even bid you the warmth of farewell"',
        },
        { kind: "cite", value: "[1]", citation: 1 },
        {
          kind: "text",
          value: " — a stronger reassurance than denying mere absence.",
        },
      ],
    },
    {
      segments: [
        {
          kind: "text",
          value:
            "The verse arrived during a documented pause in revelation. The pagans of Quraysh had taunted the Prophet ﷺ that his Lord had abandoned him",
        },
        { kind: "cite", value: "[2]", citation: 2 },
        {
          kind: "text",
          value:
            ". The surah itself is the answer — not an explanation of the pause, but a reframing of what the pause meant.",
        },
      ],
    },
    {
      segments: [
        {
          kind: "text",
          value: "Read for yourself: the verse pairs two negations carefully. ",
        },
        { kind: "emphasis", value: "Waddaʿaka" },
        { kind: "text", value: " denies a warm farewell; " },
        { kind: "emphasis", value: "qalā" },
        {
          kind: "text",
          value:
            " denies a cold heart. Both possibilities are closed. As-Saʿdī notes that what we call divine silence is often divine timing",
        },
        { kind: "cite", value: "[3]", citation: 3 },
        {
          kind: "text",
          value:
            " — and that the longing produced in the waiting deepens what is eventually given.",
        },
      ],
    },
  ],
  closing:
    "For your own life: the verse does not promise that every silence is a delay. It promises that the silence between you and your Lord — if you are turning toward Him — is never the silence of abandonment.",
  citations: [
    {
      number: 1,
      source: "Tafsir As-Saʿdī",
      author: "ʿAbd ar-Raḥmān as-Saʿdī",
      ref: "93:3",
      arabic: "ما تركك منذ اعتنى بك، وما أبغضك منذ أحبك",
      english:
        "He has not left you since He took charge of you, nor disliked you since He loved you.",
    },
    {
      number: 2,
      source: "Tafsir Ibn Kathīr",
      author: "Ismāʿīl ibn Kathīr",
      ref: "93:3",
      arabic: "فقالت قريش: قد ودَّعه ربه وقلاه",
      english:
        "Quraysh said: His Lord has parted with him and hates him — so God sent down this surah.",
    },
    {
      number: 3,
      source: "Tafsir al-Qurṭubī",
      author: "Muḥammad al-Qurṭubī",
      ref: "93:3",
      arabic: "احتبس الوحي عن رسول الله صلى الله عليه وسلم خمسة عشر يوماً",
      english:
        "Revelation was withheld from the Messenger ﷺ for fifteen days — and then this surah came.",
    },
  ],
  retrieval: [
    { source: "Tafsir As-Saʿdī", status: "done", meta: "4 passages" },
    { source: "Tafsir Ibn Kathīr", status: "done", meta: "3 passages" },
    { source: "Tafsir al-Qurṭubī", status: "done", meta: "2 passages" },
  ],
  confidence: { level: "high", sources: 3, total: 3 },
  durationMs: 1400,
};

export const STREAMING_RETRIEVAL: readonly RetrievalStep[] = [
  { source: "Tafsir As-Saʿdī", status: "done", meta: "4 passages" },
  { source: "Tafsir Ibn Kathīr", status: "done", meta: "3 passages" },
  { source: "Tafsir al-Qurṭubī", status: "active", meta: "searching…" },
  { source: "Tafsir aṭ-Ṭabarī", status: "pending", meta: "queued" },
];

export const STREAMING_TEXT =
  "The phrase mā waddaʿaka rabbuka — 'your Lord has not forsaken you' — uses a verb (waddaʿa) whose ordinary use is parting between two who love each other. The classical commentators read this carefully: the negation is not just 'God hasn't left,' it's 'God hasn't even";

export const SAMPLE_DEFERRAL: Deferral = {
  question: "Did the Prophet ﷺ ever feel God was angry with him during the pause in revelation?",
  scope: "Ad-Ḍuḥā 93:1–11",
  retrieval: [
    { source: "Tafsir As-Saʿdī", status: "done", meta: "0 direct matches" },
    { source: "Tafsir Ibn Kathīr", status: "done", meta: "1 oblique" },
    {
      source: "Tafsir al-Qurṭubī",
      status: "done",
      meta: "0 direct matches",
    },
  ],
  confidence: { level: "low", sources: 1, total: 3 },
  body: [
    "**The classical tafsir corpus doesn't address the Prophet's ﷺ *internal experience* of the pause directly.** What the commentaries describe is the external situation: revelation paused, Quraysh mocked, this surah arrived as the response.",
    "What you're asking — about whether the Prophet ﷺ *felt* God's anger — is a question about subjective experience, and the verse is explicit that no such anger existed (*mā qalā*). But the texts I'm drawing on don't speculate about his internal state in the way your question implies.",
    "I can give you what the sources *do* say, or you can rephrase. Both options below.",
  ],
};
