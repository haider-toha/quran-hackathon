import type { Note } from "@/types";

// 14 notes across the depth of Surat Aḍ-Ḍuḥā. Variety chosen for QA:
//   • two notes have full markdown bodies (n1, n5) — exercises NoteBody
//   • one is a long letter-to-self (n5) — exercises overflow / scroll
//   • two are AI-assisted (n1, n9) — exercises hasAi/aiAssisted chips
//   • one was created from a template (n9, comparative-tafsir) —
//     exercises templateId rendering
//   • one has dismissed suggestions (n10) — exercises dismissal store
//   • one has zero tags (n13) — exercises empty-tag rendering
//   • range of relative dates from "4m ago" to "3 weeks ago" — exercises
//     DateFilter today/week/month/all bands
//   • tags chosen to overlap (grief, mercy, language, pattern) so
//     TagFilter has multi-match candidates and unique-tag candidates

export const SAMPLE_NOTES: readonly Note[] = [
  {
    id: "n1",
    title: "On grief that comes in waves",
    preview:
      "The verse reframes silence — the pause in revelation was not absence but preparation. There's something here about how grief teaches the same lesson, except we resist it.",
    body: GRIEF_BODY(),
    link: "93:3",
    tags: ["grief", "tawakkul", "patience", "mā-waddaʿaka"],
    editedRelative: "4m ago",
    editedAbsolute: "3 May, 18:42",
    editedAt: "2026-05-03T18:42:00Z",
    hasAi: true,
    aiAssisted: true,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n2",
    title: "The orphan and the seeker",
    preview:
      "Three findings, three responses. A pattern that maps onto how God meets every kind of lack — material, spiritual, situational. The fact that the verse uses the past tense 'found' is itself…",
    body: "",
    link: "93:6-8",
    tags: ["mercy", "pattern", "structure"],
    editedRelative: "2h ago",
    editedAbsolute: "3 May, 16:10",
    editedAt: "2026-05-03T16:10:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
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
    editedAbsolute: "2 May, 21:30",
    editedAt: "2026-05-02T21:30:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n4",
    title: "Why dawn and night together",
    preview:
      "The oath pairs ḍuḥā and layl — brightness and stillness. Reading As-Saʿdī, I see he reads them as opposites that both belong to the same hand. The point isn't 'good times and bad times'…",
    body: "",
    link: "93:1-2",
    tags: ["contemplation", "oaths", "structure"],
    editedRelative: "yesterday",
    editedAbsolute: "2 May, 14:18",
    editedAt: "2026-05-02T14:18:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n5",
    title: "Letter to myself in the next dry season",
    preview:
      "Reading 93:3 again on a calm day so I have something to remember on a hard one. The pause in the Prophet's ﷺ revelation lasted somewhere between fifteen and forty days. I have lasted longer than fifteen days in dry seasons of prayer; I have lasted shorter than forty.",
    body: LETTER_BODY(),
    link: "93:3",
    tags: ["grief", "tawakkul", "letter-to-self", "calendar"],
    editedRelative: "3 days ago",
    editedAbsolute: "30 Apr, 21:30",
    editedAt: "2026-04-30T21:30:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n6",
    title: "Reading 'qalā' carefully",
    preview:
      "The word qalā is heat — not mere displeasure, but a flaring inside the chest. To negate it so explicitly is to say: not even a flicker of that exists between you and your Lord.",
    body: "",
    link: "93:3",
    tags: ["language", "mercy", "mā-waddaʿaka"],
    editedRelative: "3 days ago",
    editedAbsolute: "30 Apr, 16:45",
    editedAt: "2026-04-30T16:45:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n7",
    title: "When something doesn't come",
    preview:
      "There's a quietly devastating implication in verse 5: some things are coming. Not all at once. We are being given according to a calendar we don't see. The right response to delay is not…",
    body: "",
    link: "93:5",
    tags: ["patience", "tawakkul", "calendar"],
    editedRelative: "5 days ago",
    editedAbsolute: "28 Apr, 22:11",
    editedAt: "2026-04-28T22:11:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n8",
    title: "Three findings — a structure",
    preview:
      "Verses 6, 7, 8 each open with wajadaka. The repetition is rhetorical but also theological: God finding the human is the precondition for everything else.",
    body: "",
    link: "93:6-8",
    tags: ["pattern", "structure", "wajadaka"],
    editedRelative: "1 week ago",
    editedAbsolute: "26 Apr, 12:30",
    editedAt: "2026-04-26T12:30:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n9",
    title: "Comparative tafsir on 93:5 — As-Saʿdī, Ibn Kathīr, al-Qurṭubī",
    preview:
      "Started this from the Comparative Tafsir template. Reading the three commentaries side by side on la-sawfa yuʿṭīka makes the open-endedness of the gift very visible — none of them name what is being given, all of them gesture at why the silence is holding it.",
    body: COMPARATIVE_BODY(),
    link: "93:5",
    tags: ["comparative", "language", "calendar"],
    editedRelative: "1 week ago",
    editedAbsolute: "26 Apr, 09:15",
    editedAt: "2026-04-26T09:15:00Z",
    hasAi: true,
    aiAssisted: true,
    templateId: "comparative-tafsir",
    dismissedSuggestions: [],
  },
  {
    id: "n10",
    title: "Don't repel — what 'rebuke' means in 93:10",
    preview:
      "Lā tanhar — do not rebuke. The verb is sharper than 'be kind.' It names the specific tone-of-voice the verse forbids, even when the answer to the asker is no. A note on the gap between declining and rebuking.",
    body: "",
    link: "93:10",
    tags: ["ethics", "language", "command"],
    editedRelative: "2 weeks ago",
    editedAbsolute: "19 Apr, 10:50",
    editedAt: "2026-04-19T10:50:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: ["default-prompt", "default-related-93-3"],
  },
  {
    id: "n11",
    title: "Tested by ease, not by hardship",
    preview:
      "The challenge of verse 11 — proclaiming the favor — is harder than enduring the trial. Hardship breaks pride; ease grows it. A note for the next time things go well.",
    body: "",
    link: "93:11",
    tags: ["gratitude", "humility"],
    editedRelative: "2 weeks ago",
    editedAbsolute: "18 Apr, 07:02",
    editedAt: "2026-04-18T07:02:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n12",
    title: "Names of God in this surah",
    preview:
      "Only one name appears explicitly — Rabb, repeated four times: rabbuka in verses 3, 5, 11, and rabbika in 11 again. The choice is deliberate. It is the name of nurture and of unfolding care, and the surah is about the unfolding.",
    body: "",
    link: "93:3",
    tags: ["names", "language"],
    editedRelative: "3 weeks ago",
    editedAbsolute: "12 Apr, 22:05",
    editedAt: "2026-04-12T22:05:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: "names-of-allah",
    dismissedSuggestions: [],
  },
  {
    id: "n13",
    title: "Random thought on al-ākhiratu khayr",
    preview: "Just want to remember this. Coming back later.",
    body: "",
    link: "93:4",
    tags: [],
    editedRelative: "3 weeks ago",
    editedAbsolute: "11 Apr, 23:48",
    editedAt: "2026-04-11T23:48:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
  },
  {
    id: "n14",
    title: "The asbāb al-nuzūl in Bukhārī 4983",
    preview:
      "Jundub b. Sufyān reports the wife of Abū Lahab — Umm Jamīl — saying 'I see only that your shayṭān has bid you farewell.' The word she uses for *bid farewell* is the same root that the surah negates two verses later. The Quran answers her in her own vocabulary.",
    body: "",
    link: "93:1",
    tags: ["asbab-al-nuzul", "language", "history"],
    editedRelative: "3 weeks ago",
    editedAbsolute: "10 Apr, 16:30",
    editedAt: "2026-04-10T16:30:00Z",
    hasAi: false,
    aiAssisted: false,
    templateId: null,
    dismissedSuggestions: [],
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
    "",
    "## What grief does to this",
    "",
    "Grief makes the silence feel diagnostic — as though the absence is *about* me, *of* me. The tafsir corpus on 93:3 does not let that reading stand. *Mā waddaʿaka* — *he has not bid you farewell* — is the negation of a *relational* event, not a *judgmental* one. The verse is denying that something happened, not justifying that something is.",
    "",
    "Reading it that way takes the weight of the silence off my interpretation and puts it back on the calendar of God's giving — which I do not see, and which is not my job to read.",
  ].join("\n");
}

function LETTER_BODY(): string {
  return [
    "*Dear me, on the day this is needed —*",
    "",
    "I'm writing this on a quiet Friday afternoon, when the sky is light and prayer feels easy and I am not the version of myself this letter is for. It is for the version of me who is in a dry season, when no du'a feels heard and the morning is silent in a way that frightens you.",
    "",
    "## What I want you to remember",
    "",
    "1. **The pause was real.** The Prophet ﷺ — the Prophet ﷺ — went through a *fatra*, a pause in revelation, somewhere between fifteen and forty days long. The classical sources don't agree on the duration; what they agree on is that it happened. You are not the first person on the road who has felt this way.",
    "",
    "2. **The pause was not punishment.** Read 93:3 carefully. The verse negates *farewell* (*waddaʿaka*) and *active dislike* (*qalā*). Both. The text closes both possibilities at once.",
    "",
    "3. **The pause was timed, not cruel.** As-Saʿdī's framing — that the longing produced in waiting deepens what is eventually given — is the framing I want you to hold onto. Not because it makes the waiting easier in the moment, but because it tells you the truth about what the waiting is *for*.",
    "",
    "## A practical thing",
    "",
    "When you cannot pray, at least *speak*. Even if it's just *yā Rabb, ana hunā* — *my Lord, I am here.* That is not nothing. The surah ends with *fa-ḥaddith* — *speak* — and the verb has been doing work for fourteen hundred years.",
    "",
    "## Closing",
    "",
    "The morning has come before. It will come again. The proof is that this letter exists, written by a version of you who is on the other side of a previous *fatra* you have already forgotten the shape of.",
    "",
    "*— You, on a Friday in late April*",
  ].join("\n");
}

function COMPARATIVE_BODY(): string {
  return [
    "Started this with the *Comparative Tafsir* template — three commentaries side by side on the single verse 93:5. The shape of the page is the shape of the inquiry: do these three readings agree, diverge, or fill different gaps?",
    "",
    "## The verse",
    "",
    "**93:5** — *wa la-sawfa yuʿṭīka rabbuka fa-tarḍā* — *And your Lord is going to give you, and you will be satisfied.*",
    "",
    "## As-Saʿdī",
    "",
    "Reads *la-sawfa* as the emphasised, unhurried future: *most certainly will give, in His own time*. Notes that the gift is left without a noun — and treats the open-endedness as itself the gift. Every promise to the Prophet ﷺ falls within its scope.",
    "",
    "## Ibn Kathīr",
    "",
    "Anchors the verse historically. Cites the narration from Ibn ʿAbbās that the Prophet ﷺ was shown what would *open for his community after him, region by region*, and that this *pleased him* — and then the verse came down. So *fa-tarḍā* is not abstract; it is the contentment of having been shown what will be.",
    "",
    "## Al-Qurṭubī",
    "",
    "Brings the *most-hopeful-verse* tradition. Quotes aṭ-Ṭabarī: *this is the most hopeful verse in the Book of God*, on the strength of the Prophet ﷺ's saying *I shall not be content while a single one of my community is in the Fire*. So the contentment in *fa-tarḍā* has a *floor* — it cannot land while anyone the Prophet ﷺ loves is still suffering.",
    "",
    "## Where they converge",
    "",
    "All three read *la-sawfa* as emphatic, not flat. All three read *fa-tarḍā* as a *condition the giving must meet* — the gift continues until contentment. None of them try to *list* what will be given.",
    "",
    "## Where they diverge",
    "",
    "As-Saʿdī treats the verse atemporally. Ibn Kathīr anchors it to a specific historical revelation about the future of the umma. Al-Qurṭubī widens it to soteriology — the verse becomes a basis for hope about the community's ultimate fate.",
    "",
    "## What I take",
    "",
    "The three readings do not contradict; they nest. The atemporal frame (As-Saʿdī) holds the historical anchor (Ibn Kathīr) holds the soteriological reach (Qurṭubī). Reading the three together makes the verse feel structurally solid in a way that any one alone does not.",
  ].join("\n");
}

export function findNote(id: string): Note | undefined {
  return SAMPLE_NOTES.find((n) => n.id === id);
}

export const FEATURED_NOTE_ID = "n1";
