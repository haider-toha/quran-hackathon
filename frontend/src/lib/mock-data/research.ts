import type { ResearchResult } from "@/types";

export const SAMPLE_RESEARCH: readonly ResearchResult[] = [
  {
    id: "r1",
    type: "lecture",
    title: "The Pause Before the Gift — A Tafsir of Ad-Duha",
    speaker: "Dr. Yasir Qadhi",
    trust: "verified",
    meta: "42 min · Lecture · 2019",
    duration: "42:18",
    snippet:
      "When the wahy paused, the Prophet ﷺ felt it as absence. This sermon traces how the surah responds — not by explaining the silence away, but by reframing what silence means in a relationship with God.",
  },
  {
    id: "r2",
    type: "article",
    title: "Ad-Duha and the Theology of Pauses",
    speaker: "Dr. Sherman Jackson",
    trust: "verified",
    meta: "8 min read · Article · The American Muslim",
    duration: null,
    snippet:
      "A reading of Ad-Duha through the lens of Islamic theology of trials. Argues that the surah's structure — oath, reassurance, recollection, charge — is itself a pedagogical model for moving through periods of perceived divine absence.",
  },
  {
    id: "r3",
    type: "article",
    title: "The orphan in Quranic ethics: Ad-Duha 93:9",
    speaker: "Maria Massi Dakake",
    trust: "unknown",
    meta: "12 min read · Academic · Journal of Quranic Studies",
    duration: null,
    snippet:
      "Examines how verse 9 generalizes the address — from a specific command to the Prophet ﷺ to a universal ethical injunction. Discusses the linguistic shift between vocative and indicative modes.",
  },
  {
    id: "r4",
    type: "video",
    title: "Surah Ad-Duha — Verse-by-verse explanation",
    speaker: "Nouman Ali Khan",
    trust: "verified",
    meta: "1h 12 min · Video · Bayyinah",
    duration: "1:12:04",
    snippet:
      "Linguistic deep-dive into the surah. Explores why ḍuḥā and layl are paired in oath, and what the choice of waddaʿaka over taraka does theologically. Particular attention to verse 3.",
  },
  {
    id: "r5",
    type: "lecture",
    title: "When the prayer feels like it is hitting a ceiling",
    speaker: "Mohammad Elshinawy",
    trust: "verified",
    meta: "24 min · Lecture · Yaqeen",
    duration: "24:32",
    snippet:
      "Pastoral reflection on the experience of feeling spiritually disconnected. Cites Ad-Duha as a textual anchor for the position that perceived divine silence is not, theologically, divine absence.",
  },
];

export const RESEARCH_QUESTION =
  "What does the pause in revelation in Surat Ad-Ḍuḥā teach us about feeling spiritually distant?";

export const RESEARCH_TOTAL_RESULTS = 12;
