import type { ResearchResult, ResearchSynthesisGroup } from "@/types";

// Sample external-research corpus across the three media types and three
// trust levels. Each item has explicit `source` and `year` fields (rather
// than a parsed meta string) so the card can lay out the source line
// without splitting tokens at render time.

export const SAMPLE_RESEARCH: readonly ResearchResult[] = [
  {
    id: "r1",
    type: "lecture",
    title: "The Pause Before the Gift — A Tafsir of Surat Ad-Duha",
    speaker: "Dr. Yasir Qadhi",
    trust: "verified",
    source: "AlMaghrib",
    year: "2019",
    duration: "42:18",
    snippet:
      "When the wahy paused, the Prophet ﷺ felt it as absence. This sermon traces how the surah responds — not by explaining the silence away, but by reframing what silence means in a relationship with God. Anchors the reading in the Bukhari 4983 narration of Jundub b. Sufyan.",
    readTimeMinutes: null,
  },
  {
    id: "r2",
    type: "article",
    title: "Ad-Duha and the Theology of Pauses",
    speaker: "Dr. Sherman Jackson",
    trust: "verified",
    source: "The American Muslim",
    year: "2018",
    duration: null,
    snippet:
      "A reading of Ad-Duha through the lens of Islamic theology of trials. Argues that the surah's structure — oath, reassurance, recollection, charge — is itself a pedagogical model for moving through periods of perceived divine absence.",
    readTimeMinutes: 8,
  },
  {
    id: "r3",
    type: "article",
    title: "The orphan in Quranic ethics: a close reading of Ad-Duha 93:9",
    speaker: "Maria Massi Dakake",
    trust: "unknown",
    source: "Journal of Quranic Studies 14.2",
    year: null,
    duration: null,
    snippet:
      "Examines how verse 9 generalizes the address — from a specific command to the Prophet ﷺ to a universal ethical injunction. Discusses the linguistic shift between vocative and indicative modes; argues the surah's three-finding structure is rhetorically rare and theologically load-bearing.",
    readTimeMinutes: 12,
  },
  {
    id: "r4",
    type: "video",
    title: "Surah Ad-Duha — verse-by-verse explanation",
    speaker: "Nouman Ali Khan",
    trust: "verified",
    source: "Bayyinah TV",
    year: "2016",
    duration: "1:12:04",
    snippet:
      "Linguistic deep-dive into the surah. Explores why duha and layl are paired in oath, and what the choice of waddaaka over taraka does theologically. Particular attention to verse 3 and to the structural mirroring of verses 6-8 with verses 9-11.",
    readTimeMinutes: null,
  },
  {
    id: "r5",
    type: "lecture",
    title: "When the prayer feels like it is hitting a ceiling",
    speaker: "Mohammad Elshinawy",
    trust: "verified",
    source: "Yaqeen Institute",
    year: "2021",
    duration: "24:32",
    snippet:
      "Pastoral reflection on the experience of feeling spiritually disconnected. Cites Ad-Duha as a textual anchor for the position that perceived divine silence is not, theologically, divine absence. Includes a section on the difference between the diagnostic reading of silence and the trusting one.",
    readTimeMinutes: null,
  },
  {
    id: "r6",
    type: "video",
    title: "Allah Has Not Left You — A Deeper Look at Ad-Duha",
    speaker: "Nouman Ali Khan",
    trust: "verified",
    source: "Bayyinah TV",
    year: null,
    duration: "18:24",
    snippet:
      "A short Bayyinah lecture on what the Prophet ﷺ felt during the pause in revelation. Reads waddaaka in its formal-farewell register and contrasts the Quran's own choice of vocabulary with the Quraysh taunt that prompted the surah.",
    readTimeMinutes: null,
  },
  {
    id: "r7",
    type: "video",
    title: "Secret Message From Surah Ad-Duha",
    speaker: "Mufti Menk",
    trust: "verified",
    source: "Mufti Menk Channel",
    year: "2020",
    duration: "9:42",
    snippet:
      "Brief, accessible reading of the surah focused on the rhetorical structure of la-sawfa yutika rabbuka fa-tarda — *will most certainly give you, and you will be content*. Frames the verse as a generic anchor of hope alongside its primary address to the Prophet ﷺ.",
    readTimeMinutes: null,
  },
  {
    id: "r8",
    type: "article",
    title: "Asbab al-Nuzul on Ad-Duha: a survey of the durations narrated",
    speaker: "Dr. Sohaib Saeed",
    trust: "verified",
    source: "Quran Tafseer Institute",
    year: "2022",
    duration: null,
    snippet:
      "Catalogues the four canonical positions on the duration of the *fatra* (twelve, fifteen, twenty-five, forty days) and traces the chains. Notes that al-Qurtubi treats fifteen days as the majority view and that Ibn Kathir's commentary on the surah declines to commit to a number.",
    readTimeMinutes: 11,
  },
  {
    id: "r9",
    type: "lecture",
    title: "Patience in the unanswered prayer — readings from Ad-Duha 93:5",
    speaker: "Dr. Omar Suleiman",
    trust: "verified",
    source: "Yaqeen Institute",
    year: "2020",
    duration: "31:08",
    snippet:
      "Pastoral khutbah on the unhurried la-sawfa of verse 5. Argues that the verse should reshape the believer's expectation of the *timing* of God's giving rather than the *fact* of it. Includes the at-Tabari tradition that this is the *most hopeful verse* in the Quran.",
    readTimeMinutes: null,
  },
  {
    id: "r10",
    type: "article",
    title: "On the linguistic register of waddaa: parting between intimates",
    speaker: "Dr. Akram Nadwi",
    trust: "verified",
    source: "Cambridge Islamic College",
    year: "2019",
    duration: null,
    snippet:
      "Concise close-reading of the verb waddaa in classical Arabic usage. Distinguishes it from taraka (left), faraqa (separated), and ghaba (was absent). Argues that the verse's choice of waddaaka is shaped to the precise register of fear in the Quraysh taunt.",
    readTimeMinutes: 6,
  },
  {
    id: "r11",
    type: "video",
    title: "The Three Wajadakas — Surah Ad-Duha in 4 minutes",
    speaker: "Sh. Mohammed Mana",
    trust: "verified",
    source: "Reminder",
    year: "2022",
    duration: "4:18",
    snippet:
      "A condensed reading of 93:6-8 focused on the structural mirroring with 93:9-11. Useful as a short overview before deeper study; not a substitute for verse-by-verse tafsir.",
    readTimeMinutes: null,
  },
  {
    id: "r12",
    type: "article",
    title: "When silence is mercy: Ad-Duha for the spiritually exhausted",
    speaker: "Sh. Hamza Yusuf",
    trust: "verified",
    source: "Renovatio",
    year: "2021",
    duration: null,
    snippet:
      "Theological-pastoral essay on the surah as a model for periods of dryness in prayer. Reads As-Sadi's *tarbiyya* framing of the pause and connects it to the Akbari tradition of *qabd wa bast* (constraint and expansion) in the spiritual life.",
    readTimeMinutes: 14,
  },
  {
    id: "r13",
    type: "video",
    title: "Surah Ad-Duha — popular interpretation channel (caution: unsourced)",
    speaker: "BrotherTalksQuran",
    trust: "flagged",
    source: "YouTube",
    year: "2024",
    duration: "37:55",
    snippet:
      "Popular YouTube channel offering a personal reading of the surah. Some claims (e.g. specific durations of the fatra, the speaker's account of what the Prophet ﷺ *felt*) are not anchored in the canonical sources. Flagged for sourcing discipline.",
    readTimeMinutes: null,
  },
  {
    id: "r14",
    type: "lecture",
    title: "Ad-Duha and the structure of consolation",
    speaker: "Dr. Fakhr-ul-Islam Banuri",
    trust: "unknown",
    source: "Darul Uloom Karachi",
    year: "2017",
    duration: "2:18:50",
    snippet:
      "Long-form classical lecture (Urdu with English subtitles) treating Ad-Duha alongside Ash-Sharh as a paired *consolation diptych*. Trust unknown pending corpus review of the speaker's broader output. Long-running lecture; index by section.",
    readTimeMinutes: null,
  },
];

export const RESEARCH_QUESTION =
  "What does the pause in revelation in Surat Ad-Duha teach us about feeling spiritually distant?";

export const RESEARCH_TOTAL_RESULTS = 23;

// Hand-authored synthesis across the corpus. Renders above results as the
// page's headline interpretation — the AI's job here is to cluster
// readings, not just list sources. Keep this terse: each group is one
// reading + the speakers who hold it.
export const RESEARCH_SYNTHESIS: readonly ResearchSynthesisGroup[] = [
  {
    id: "preparation",
    label: "Pause as preparation",
    body: "The silence is pedagogical — the Prophet ﷺ being formed for the responsibility of what follows.",
    speakers: ["Dr. Yasir Qadhi", "Dr. Sherman Jackson", "Nouman Ali Khan", "Sh. Hamza Yusuf"],
  },
  {
    id: "ordeal",
    label: "Pause as ordeal",
    body: "Perceived divine absence is itself the lesson; patience under contraction is the discipline being taught.",
    speakers: ["Dr. Omar Suleiman", "Mohammad Elshinawy"],
  },
  {
    id: "linguistic",
    label: "Linguistic and rhetorical reading",
    body: "Focus on the surah's structure — the choice of waddaaka, the mirroring of verses 6–8 with 9–11.",
    speakers: ["Maria Massi Dakake", "Dr. Akram Nadwi", "Sh. Mohammed Mana"],
  },
];
