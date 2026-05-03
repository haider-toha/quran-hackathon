// Voice + copy constants. The voice is contemplative, declarative, source-
// first. No emoji. No exclamation marks. No hype. Loading messages name the
// activity rather than entertain. Empty states orient before they invite
// action.

export const COPY_VOICE = `Mishkat's voice is contemplative, source-first, and quiet. We name what we are doing rather than entertain the user while we do it. We do not use emoji, exclamation marks, or hype. When we do not know, we say so and we show what the sources do say. When we cite, we attribute. When we suggest, we explain why.`;

// Continue-from-last-read banner copy. Quiet, declarative, no exclamation.
export const CONTINUE_READING_LABEL = "Continue reading";

export const LOADING_MESSAGES: readonly string[] = [
  "Searching the tafsir corpus…",
  "Retrieving relevant passages…",
  "Reading As-Sadi…",
  "Reading Ibn Kathir…",
  "Reading al-Qurtubi…",
  "Cross-checking citations…",
  "Drawing the threads together…",
];

export const EMPTY_STATES = {
  library: {
    title: "Your library is quiet for now.",
    body: "Save a verse, a tafsir excerpt, or a question to start gathering them here.",
    cta: "Open the reader",
  },
  journal: {
    title: "Nothing written yet.",
    body: "A note can begin from a verse, a question, or a feeling. There is no wrong place to start.",
    cta: "Start a note",
  },
  research: {
    title: "Research begins where the tafsir ends.",
    body: "Search beyond the canonical corpus when the question reaches further than the commentary.",
    cta: "Open research",
  },
  ask: {
    title: "Ask something the corpus might address.",
    body: "We answer from classical tafsir. When the sources do not address a question directly, we say so.",
    cta: null,
  },
  suggestions: {
    title: "No suggestions right now.",
    body: "Suggestions surface as you write — related verses, tafsir matches, and notes you have already gathered.",
    cta: null,
  },
} as const;
