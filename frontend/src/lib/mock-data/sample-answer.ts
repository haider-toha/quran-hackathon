import type { Answer, AskScenario, AskScenarioVariant, Deferral, RetrievalStep } from "@/types";

// Three deeply-modeled Ask scenarios, each with multiple phrasings and
// at least one edge-case variant. Together they exercise:
//   • answered + streaming surfaces (full canonical answers)
//   • low-confidence deferral (intent that the corpus can't resolve)
//   • off-scope / ambiguous / partial input shapes (deferral)
//   • retrieval pipeline progress (pending → active → done)
//
// The classical sources cited (As-Sadi, Ibn Kathir, al-Qurtubi, at-Tabari)
// are the canonical tafsir corpus on Ad-Duha 93. The Bukhari 4983 /
// Muslim 1797 narration of Jundub b. Sufyan anchors the historical
// context (the wife of Abu Lahab's taunt, the *fatra*).

// ─────────────────────────────────────────────────────────────────────────
// Scenario 1 — "What does it mean that God 'has not forsaken' the
// Prophet ﷺ — and how should I read that when my own prayer feels
// unanswered?" (canonical pastoral question on 93:3)
// ─────────────────────────────────────────────────────────────────────────

const S1_CANONICAL: Answer = {
  question:
    "What does it mean that God 'has not forsaken' the Prophet ﷺ — and how should I read that when my own prayer feels unanswered?",
  scope: "Ad-Duha 93:1–11",
  paragraphs: [
    {
      segments: [
        { kind: "text", value: "The phrase " },
        { kind: "emphasis", value: "ma waddaaka rabbuka" },
        {
          kind: "text",
          value: ' — "your Lord has not forsaken you" — uses a verb (',
        },
        { kind: "emphasis", value: "waddaa" },
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
            "The verse arrived during a documented pause in revelation. The pagans of Quraysh — and notably the wife of Abu Lahab — taunted the Prophet ﷺ that his Lord had abandoned him",
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
        { kind: "emphasis", value: "Waddaaka" },
        { kind: "text", value: " denies a warm farewell; " },
        { kind: "emphasis", value: "qala" },
        {
          kind: "text",
          value:
            " denies a cold heart. Both possibilities are closed. As-Sadi notes that what we call divine silence is often divine timing",
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
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi",
      ref: "93:3",
      arabic: "ما تركك منذ اعتنى بك، وما أبغضك منذ أحبك",
      english:
        "He has not left you since He took charge of you, nor disliked you since He loved you.",
    },
    {
      number: 2,
      source: "Sahih al-Bukhari 4983 / Muslim 1797",
      author: "via Jundub b. Sufyan",
      ref: "93:1",
      arabic:
        "اشتكى النبي ﷺ فلم يقم ليلتين أو ثلاثاً، فجاءته امرأة فقالت: يا محمد ما أرى شيطانك إلا قد ودَّعك. فأنزل الله: والضحى والليل إذا سجى ما ودَّعك ربك وما قلى.",
      english:
        "The Prophet ﷺ fell ill and did not rise to pray for two or three nights. A woman came and said, 'O Muhammad, I see only that your *shaytan* has bid you farewell.' So God revealed: 'By the morning, and by the night when it grows still — your Lord has not forsaken you, nor does He hate you.'",
    },
    {
      number: 3,
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi",
      ref: "93:3",
      arabic: "احتبس الوحي عن رسول الله صلى الله عليه وسلم خمسة عشر يوماً",
      english:
        "Revelation was withheld from the Messenger ﷺ for fifteen days — and then this surah came.",
    },
  ],
  retrieval: [
    { source: "Tafsir As-Sadi", status: "done", meta: "4 passages" },
    { source: "Tafsir Ibn Kathir", status: "done", meta: "3 passages" },
    { source: "Tafsir al-Qurtubi", status: "done", meta: "2 passages" },
    { source: "Sunnah corpus", status: "done", meta: "1 hadith (Bukhari 4983)" },
  ],
  confidence: { level: "high", sources: 4, total: 4 },
  durationMs: 1400,
};

const S1_TERSE_VARIANT: Answer = {
  // Same shape, condensed phrasing — the model collapses the framing and
  // gives just the textual finding plus the closing.
  question: "what does *ma waddaaka* mean",
  scope: "Ad-Duha 93:1–11",
  paragraphs: [
    {
      segments: [
        { kind: "text", value: "Literally: " },
        { kind: "emphasis", value: "your Lord has not bid you farewell" },
        {
          kind: "text",
          value: ". The verb ",
        },
        { kind: "emphasis", value: "waddaa" },
        {
          kind: "text",
          value:
            " is not 'leave' — it is the parting between two who love each other. Negating it denies that any farewell has occurred at all",
        },
        { kind: "cite", value: "[1]", citation: 1 },
        { kind: "text", value: "." },
      ],
    },
    {
      segments: [
        { kind: "text", value: "Paired in the same verse with " },
        { kind: "emphasis", value: "qala" },
        {
          kind: "text",
          value:
            " (active dislike, heat in the chest). Both denied — so the verse closes both possibilities at once",
        },
        { kind: "cite", value: "[2]", citation: 2 },
        { kind: "text", value: "." },
      ],
    },
  ],
  closing:
    "Two negations, two reassurances. Forsakenness denies absence; *qila* denies displeasure.",
  citations: [
    {
      number: 1,
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir",
      ref: "93:3",
      arabic: "ما تركك ربك يا محمد، وما أبغضك",
      english: "Your Lord has not left you, O Muhammad, nor has He hated you.",
    },
    {
      number: 2,
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi",
      ref: "93:3",
      arabic: "ما تركك منذ اعتنى بك، وما أبغضك منذ أحبك",
      english:
        "He has not left you since He took charge of you, nor disliked you since He loved you.",
    },
  ],
  retrieval: [
    { source: "Tafsir Ibn Kathir", status: "done", meta: "2 passages" },
    { source: "Tafsir As-Sadi", status: "done", meta: "2 passages" },
  ],
  confidence: { level: "high", sources: 2, total: 2 },
  durationMs: 880,
};

const S1_SPECULATIVE_DEFERRAL: Deferral = {
  // Edge variant — user asks about the Prophet's *internal experience*
  // during the pause, which the classical corpus refuses to speculate on.
  question: "Did the Prophet ﷺ ever feel God was angry with him during the pause in revelation?",
  scope: "Ad-Duha 93:1–11",
  retrieval: [
    { source: "Tafsir As-Sadi", status: "done", meta: "0 direct matches" },
    { source: "Tafsir Ibn Kathir", status: "done", meta: "1 oblique" },
    {
      source: "Tafsir al-Qurtubi",
      status: "done",
      meta: "0 direct matches",
    },
    { source: "Sunnah corpus", status: "done", meta: "1 hadith (external state)" },
  ],
  confidence: { level: "low", sources: 1, total: 4 },
  body: [
    "**The classical tafsir corpus doesn't address the Prophet's ﷺ *internal experience* of the pause directly.** What the commentaries describe is the external situation: revelation paused, Quraysh — and the wife of Abu Lahab specifically — mocked, this surah arrived as the response (Bukhari 4983).",
    "What you're asking — about whether the Prophet ﷺ *felt* God's anger — is a question about subjective experience, and the verse is explicit that no such anger existed (*ma qala*). But the texts I'm drawing on don't speculate about his internal state in the way your question implies.",
    "I can give you what the sources *do* say about his outward state during the *fatra*, or you can rephrase. Both options below.",
  ],
};

const SCENARIO_1: AskScenario = {
  id: "scenario-ma-waddaaka",
  title: "Reading ma waddaaka rabbuka",
  canonicalQuestion: S1_CANONICAL.question,
  variants: [
    {
      id: "s1-canonical",
      phrasing: S1_CANONICAL.question,
      intent: "personal-application",
      edge: null,
      outcome: { kind: "answer", answer: S1_CANONICAL },
    },
    {
      id: "s1-terse",
      phrasing: S1_TERSE_VARIANT.question,
      intent: "linguistic",
      edge: "Terse, lowercased input — model still resolves and answers tightly.",
      outcome: { kind: "answer", answer: S1_TERSE_VARIANT },
    },
    {
      id: "s1-speculative",
      phrasing: S1_SPECULATIVE_DEFERRAL.question,
      intent: "speculative",
      edge: "Asks about the Prophet ﷺ's *internal experience* — corpus declines to speculate.",
      outcome: { kind: "deferral", deferral: S1_SPECULATIVE_DEFERRAL },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// Scenario 2 — "Why does the surah talk about being an orphan?" (the
// three wajadaka clauses, 93:6-8). Canonical answer = historical-textual,
// terse variant = direct, off-scope variant = deferral when the user asks
// about a comparative-religion frame the corpus does not cover.
// ─────────────────────────────────────────────────────────────────────────

const S2_CANONICAL: Answer = {
  question: "Why does the surah talk about being an orphan?",
  scope: "Ad-Duha 93:1–11",
  paragraphs: [
    {
      segments: [
        { kind: "text", value: "Verses 6–8 turn from oath and reassurance to recollection: " },
        {
          kind: "emphasis",
          value: "alam yajidka yatiman fa-awa",
        },
        { kind: "text", value: " — " },
        { kind: "emphasis", value: '"Did He not find you an orphan and shelter you?"' },
        {
          kind: "text",
          value:
            " The Prophet ﷺ's father Abdallah died before he was born; his mother Amina when he was six; his grandfather Abd al-Muttalib when he was eight. The verse does not list these losses — it names the condition they produced and the response they received",
        },
        { kind: "cite", value: "[1]", citation: 1 },
        { kind: "text", value: "." },
      ],
    },
    {
      segments: [
        { kind: "text", value: "All three findings are introduced with the same verb — " },
        { kind: "emphasis", value: "wajadaka" },
        {
          kind: "text",
          value:
            " — *He found you*. Ibn Kathir reads this as a structural pattern: God's response is not to *fix* the lack but to *meet it*. Orphan → shelter; lost → guidance; in want → sufficiency",
        },
        { kind: "cite", value: "[2]", citation: 2 },
        { kind: "text", value: "." },
      ],
    },
    {
      segments: [
        {
          kind: "text",
          value:
            "And the structure mirrors forward: each finding becomes a command in verses 9–11. Found-you-an-orphan becomes ",
        },
        { kind: "emphasis", value: "do not crush the orphan" },
        {
          kind: "text",
          value: ". The recollection is not nostalgia — it is the source of an ethics. ",
        },
        { kind: "text", value: "What you were given, give" },
        { kind: "cite", value: "[3]", citation: 3 },
        { kind: "text", value: "." },
      ],
    },
  ],
  closing:
    "The orphan in the surah is not an aside. It is the model the surah uses to teach how God meets every kind of lack — and the model He gives the Prophet ﷺ for how to be with those still inside lacks he has left behind.",
  citations: [
    {
      number: 1,
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir",
      ref: "93:6",
      arabic:
        "وذلك أن أباه توفي وأمه حامل به، وقيل بعد أن ولد، وماتت أمه وهو ابن ست سنين. ثم كان في كفالة جده عبد المطلب حتى مات وله ثمان سنين، فكفله عمه أبو طالب",
      english:
        "His father died while his mother was still carrying him — and it has been said: after he was born. His mother died when he was six. Then he was under the care of his grandfather Abd al-Muttalib until the latter's death when he was eight, after which his uncle Abu Talib took him in.",
    },
    {
      number: 2,
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi",
      ref: "93:6-8",
      arabic:
        "ألم يجدك يتيماً فآوى. ووجدك ضالاً فهدى. ووجدك عائلاً فأغنى. هذه نعم ثلاث، قابلها بثلاثة أوامر",
      english:
        "Did He not find you an orphan and shelter you? And find you unaware and guide you? And find you in want and make you sufficient? Three blessings, met with three commands.",
    },
    {
      number: 3,
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi",
      ref: "93:9",
      arabic: "أي: كما كنت يتيماً فآواك الله، فلا تقهر اليتيم",
      english: "Just as you were an orphan and God sheltered you, do not crush the orphan.",
    },
  ],
  retrieval: [
    { source: "Tafsir Ibn Kathir", status: "done", meta: "4 passages" },
    { source: "Tafsir As-Sadi", status: "done", meta: "3 passages" },
    { source: "Tafsir al-Qurtubi", status: "done", meta: "2 passages" },
    { source: "Tafsir at-Tabari", status: "done", meta: "1 passage" },
  ],
  confidence: { level: "high", sources: 4, total: 4 },
  durationMs: 1620,
};

const S2_DIRECT_VARIANT: Answer = {
  question: "what are the three wajadaka clauses",
  scope: "Ad-Duha 93:1–11",
  paragraphs: [
    {
      segments: [
        { kind: "text", value: "Three clauses, all opening with " },
        { kind: "emphasis", value: "wajadaka" },
        { kind: "text", value: " (*He found you*):" },
      ],
    },
    {
      segments: [
        { kind: "text", value: "1. " },
        { kind: "emphasis", value: "yatiman fa-awa" },
        { kind: "text", value: " — orphan, sheltered (93:6)." },
      ],
    },
    {
      segments: [
        { kind: "text", value: "2. " },
        { kind: "emphasis", value: "dallan fa-hada" },
        { kind: "text", value: " — unaware/seeking, guided (93:7)." },
      ],
    },
    {
      segments: [
        { kind: "text", value: "3. " },
        { kind: "emphasis", value: "ailan fa-aghna" },
        { kind: "text", value: " — in want, made sufficient (93:8)." },
      ],
    },
    {
      segments: [
        {
          kind: "text",
          value:
            "Each clause maps to a command in verses 9–11: don't crush the orphan, don't repel the seeker, proclaim the favour",
        },
        { kind: "cite", value: "[1]", citation: 1 },
        { kind: "text", value: "." },
      ],
    },
  ],
  closing: "Three findings → three commands. The structure is the teaching.",
  citations: [
    {
      number: 1,
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi",
      ref: "93:6-11",
      arabic: "ثلاث نعم، قابلها بثلاثة أوامر",
      english: "Three blessings, met with three commands.",
    },
  ],
  retrieval: [
    { source: "Tafsir As-Sadi", status: "done", meta: "3 passages" },
    { source: "Tafsir Ibn Kathir", status: "done", meta: "2 passages" },
  ],
  confidence: { level: "high", sources: 2, total: 2 },
  durationMs: 720,
};

const S2_OFF_SCOPE_DEFERRAL: Deferral = {
  question:
    "How does the orphan motif in Ad-Duha compare to orphan stories in the Hebrew Bible or the New Testament?",
  scope: "Ad-Duha 93:1–11",
  retrieval: [
    { source: "Tafsir As-Sadi", status: "done", meta: "0 direct matches" },
    { source: "Tafsir Ibn Kathir", status: "done", meta: "0 direct matches" },
    { source: "Tafsir al-Qurtubi", status: "done", meta: "0 direct matches" },
    { source: "Comparative scripture corpus", status: "done", meta: "out of scope" },
  ],
  confidence: { level: "low", sources: 0, total: 4 },
  body: [
    "**This is a comparative-religion question, and the corpus I'm drawing on is the classical Quranic tafsir on Surat Ad-Duha specifically.** The four commentaries I have access to (As-Sadi, Ibn Kathir, al-Qurtubi, at-Tabari) treat the orphan motif inside the Quranic and prophetic frame — they don't compare it to orphan figures in the Hebrew Bible or the New Testament.",
    "If you want, I can stay in scope and unpack the *internal* logic of the orphan motif here — how 93:6 connects to 93:9, what *yatim* means in Arabic usage, how the verse is read by the classical tradition. That I can do well.",
    "If you want the comparative reading, that's a different corpus and a different question. I'd recommend asking it as a fresh search rather than trying to stretch this one.",
  ],
};

const SCENARIO_2: AskScenario = {
  id: "scenario-three-findings",
  title: "The three wajadaka clauses (93:6-8)",
  canonicalQuestion: S2_CANONICAL.question,
  variants: [
    {
      id: "s2-canonical",
      phrasing: S2_CANONICAL.question,
      intent: "direct",
      edge: null,
      outcome: { kind: "answer", answer: S2_CANONICAL },
    },
    {
      id: "s2-direct",
      phrasing: S2_DIRECT_VARIANT.question,
      intent: "direct",
      edge: "Lowercased, terse — model returns a structured list rather than prose.",
      outcome: { kind: "answer", answer: S2_DIRECT_VARIANT },
    },
    {
      id: "s2-off-scope",
      phrasing: S2_OFF_SCOPE_DEFERRAL.question,
      intent: "off-scope",
      edge: "Comparative-religion frame the configured tafsir corpus does not cover.",
      outcome: { kind: "deferral", deferral: S2_OFF_SCOPE_DEFERRAL },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// Scenario 3 — "What is la-sawfa promising — and to whom?" (93:5). The
// canonical answer engages the famous *arja aya* tradition; the variant
// covers a partial/ambiguous referent ("does this verse apply to me?");
// the deferral covers a numeric/historical question the tafsir corpus
// can answer only obliquely.
// ─────────────────────────────────────────────────────────────────────────

const S3_CANONICAL: Answer = {
  question: "What is la-sawfa promising — and to whom?",
  scope: "Ad-Duha 93:1–11",
  paragraphs: [
    {
      segments: [
        { kind: "text", value: "The verse — " },
        { kind: "emphasis", value: "wa la-sawfa yutika rabbuka fa-tarda" },
        {
          kind: "text",
          value:
            " — uses an emphasised, unhurried future. Not just *will give* but *most certainly will give, in His own time*. As-Sadi notes that the gift is left ",
        },
        { kind: "emphasis", value: "unspecified" },
        {
          kind: "text",
          value:
            " — no noun is named — and that this open-endedness is the gift: every promise to the Prophet ﷺ falls within its scope",
        },
        { kind: "cite", value: "[1]", citation: 1 },
        { kind: "text", value: "." },
      ],
    },
    {
      segments: [
        { kind: "text", value: "The closing condition is " },
        { kind: "emphasis", value: "fa-tarda" },
        {
          kind: "text",
          value:
            " — *and you will be content*. Not until *the giving runs out*; until *you* are pleased. At-Tabari calls this the *most hopeful verse* in the Quran, on the strength of the Prophet ﷺ's saying: ",
        },
        {
          kind: "emphasis",
          value: '"I shall not be content while a single one of my community is in the Fire."',
        },
        { kind: "cite", value: "[2]", citation: 2 },
      ],
    },
    {
      segments: [
        {
          kind: "text",
          value:
            'The primary addressee is the Prophet ﷺ himself. But the classical tradition reads "you" widely: the surah\'s ethics in 93:9–11 are for everyone, and the underlying logic — the gift outlasts the present lack — is offered to anyone who would hold it',
        },
        { kind: "cite", value: "[3]", citation: 3 },
        { kind: "text", value: "." },
      ],
    },
  ],
  closing:
    "*La-sawfa* is promising the Prophet ﷺ, in his ﷺ specific person, that the giving will exceed his expectations. And it is offering us the structure of that promise — that gifts arrive on a calendar we do not see, and that *enough* is measured by contentment, not by accumulation.",
  citations: [
    {
      number: 1,
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi",
      ref: "93:5",
      arabic:
        "هذا يشمل جميع ما أعطاه الله من الخير في الدنيا والآخرة، فإنه ﷺ أعطي من الفضائل والمناقب ما لم يعطه أحد من الأولين والآخرين",
      english:
        "This encompasses every good God has given him in this life and the next — for he ﷺ has been granted of merits and honours what no one before or after has been granted.",
    },
    {
      number: 2,
      source: "Tafsir at-Tabari (via al-Qurtubi)",
      author: "Muhammad ibn Jarir at-Tabari",
      ref: "93:5",
      arabic: "هذه أرجى آية في كتاب الله",
      english: "This is the most hopeful verse in the Book of God.",
    },
    {
      number: 3,
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir",
      ref: "93:5",
      arabic: "عُرض على رسول الله ﷺ ما هو فاتح على أمته من بعده كفراً كفراً، فسرَّه ذلك",
      english:
        "The Messenger ﷺ was shown what would open for his community after him, region by region, and it pleased him.",
    },
  ],
  retrieval: [
    { source: "Tafsir As-Sadi", status: "done", meta: "3 passages" },
    { source: "Tafsir Ibn Kathir", status: "done", meta: "2 passages" },
    { source: "Tafsir al-Qurtubi", status: "done", meta: "2 passages" },
    { source: "Tafsir at-Tabari", status: "done", meta: "2 passages" },
  ],
  confidence: { level: "high", sources: 4, total: 4 },
  durationMs: 1820,
};

const S3_PARTIAL_DEFERRAL: Deferral = {
  // Edge variant — partial/ambiguous referent. User asks "does this apply
  // to me," which the corpus answers only with a careful caveat.
  question: "does 93:5 apply to me",
  scope: "Ad-Duha 93:1–11",
  retrieval: [
    { source: "Tafsir As-Sadi", status: "done", meta: "1 oblique" },
    { source: "Tafsir Ibn Kathir", status: "done", meta: "1 oblique" },
    { source: "Tafsir al-Qurtubi", status: "done", meta: "0 direct" },
    { source: "Sunnah corpus", status: "done", meta: "1 hadith (community scope)" },
  ],
  confidence: { level: "med", sources: 2, total: 4 },
  body: [
    "**93:5 has a primary addressee: the Prophet ﷺ.** The classical commentaries are unanimous that the *la-sawfa yutika rabbuka* (will most certainly give *you*) refers to him directly — and they tie its scope to his specific gifts (intercession, revelation, the opening of regions for his community).",
    "**Whether the verse 'applies' to you is a more careful question.** The traditional reading is that the Prophet's ﷺ contentment in *fa-tarda* is wide enough to include his community — At-Tabari cites the hadith *'I shall not be content while one of my community is in the Fire'* as the basis for treating the verse as having communal scope. So the *promise* is to him; the *consolation* of the promise reaches anyone who is part of the community he loves.",
    "I'd be cautious about reading the verse as a personal *guarantee* of any specific outcome in your life — that's not what the tafsirs do with it. But as an anchor for hope, in the way the Prophet ﷺ used it himself, it is well within scope.",
  ],
};

const S3_HISTORICAL_VARIANT: Answer = {
  question: "How long did the pause in revelation actually last?",
  scope: "Ad-Duha 93:1–11",
  paragraphs: [
    {
      segments: [
        {
          kind: "text",
          value:
            "The classical sources give different durations and disagree without resolving — which is itself worth noting.",
        },
      ],
    },
    {
      segments: [
        { kind: "text", value: "• " },
        { kind: "emphasis", value: "Ibn Jurayj" },
        { kind: "text", value: " — twelve days. " },
        { kind: "emphasis", value: "al-Kalbi" },
        { kind: "text", value: " — fifteen days (and " },
        { kind: "emphasis", value: "al-Qurtubi" },
        { kind: "text", value: " calls this the majority position)." },
        { kind: "cite", value: "[1]", citation: 1 },
      ],
    },
    {
      segments: [
        { kind: "text", value: "• " },
        { kind: "emphasis", value: "Ibn Abbas" },
        { kind: "text", value: " — twenty-five days. " },
        { kind: "emphasis", value: "as-Suddi and Muqatil" },
        { kind: "text", value: " — forty days." },
        { kind: "cite", value: "[2]", citation: 2 },
      ],
    },
    {
      segments: [
        {
          kind: "text",
          value:
            "Ibn Kathir notes that the divergence in the asbab al-nuzul literature on this point is real, and that the surah itself does not specify the duration — only that the pause occurred and that this surah ended it",
        },
        { kind: "cite", value: "[3]", citation: 3 },
        { kind: "text", value: "." },
      ],
    },
  ],
  closing:
    "Twelve to forty days, depending on the chain. The mainstream position is around fifteen. The surah itself doesn't anchor a number — it anchors the meaning.",
  citations: [
    {
      number: 1,
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi",
      ref: "93:1",
      arabic: "احتبس الوحي عن رسول الله ﷺ خمسة عشر يوماً، وقيل اثني عشر يوماً",
      english:
        "Revelation was withheld from the Messenger ﷺ for fifteen days — and it has been said: twelve days.",
    },
    {
      number: 2,
      source: "Asbab al-Nuzul by al-Wahidi",
      author: "Ali b. Ahmad al-Wahidi",
      ref: "93:1-3",
      arabic: "وقال ابن عباس: خمساً وعشرين يوماً. وقال السدي ومقاتل: أربعين يوماً",
      english: "Ibn Abbas said: twenty-five days. As-Suddi and Muqatil said: forty days.",
    },
    {
      number: 3,
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir",
      ref: "93:1",
      arabic: "احتبس الوحي عن النبي ﷺ أيامًا، فقالت قريش: قد ودَّعه ربه وقلاه",
      english:
        "Revelation was withheld from the Prophet ﷺ for some days, and Quraysh said: 'His Lord has bid him farewell and hates him.'",
    },
  ],
  retrieval: [
    { source: "Tafsir al-Qurtubi", status: "done", meta: "3 passages" },
    { source: "Tafsir Ibn Kathir", status: "done", meta: "2 passages" },
    { source: "Asbab al-Nuzul (al-Wahidi)", status: "done", meta: "1 passage" },
  ],
  confidence: { level: "med", sources: 3, total: 3 },
  durationMs: 1280,
};

const SCENARIO_3: AskScenario = {
  id: "scenario-la-sawfa",
  title: "La-sawfa and the unhurried promise (93:5)",
  canonicalQuestion: S3_CANONICAL.question,
  variants: [
    {
      id: "s3-canonical",
      phrasing: S3_CANONICAL.question,
      intent: "personal-application",
      edge: null,
      outcome: { kind: "answer", answer: S3_CANONICAL },
    },
    {
      id: "s3-historical",
      phrasing: S3_HISTORICAL_VARIANT.question,
      intent: "historical-context",
      edge: "Tafsir corpus disagrees on duration — answer surfaces the divergence rather than picking one.",
      outcome: { kind: "answer", answer: S3_HISTORICAL_VARIANT },
    },
    {
      id: "s3-partial",
      phrasing: S3_PARTIAL_DEFERRAL.question,
      intent: "personal-application",
      edge: "Partial/ambiguous referent — *'me'* is not what the verse directly addresses; corpus carries this carefully.",
      outcome: { kind: "deferral", deferral: S3_PARTIAL_DEFERRAL },
    },
  ],
};

export const ASK_SCENARIOS: readonly AskScenario[] = [SCENARIO_1, SCENARIO_2, SCENARIO_3];

// ─────────────────────────────────────────────────────────────────────────
// Default exports — what the Ask screen renders absent any scenario
// switch. The DemoStateBar consumes ASK_SCENARIOS to cycle.
// ─────────────────────────────────────────────────────────────────────────

export const SAMPLE_QUESTION = SCENARIO_1.canonicalQuestion;
export const SAMPLE_ANSWER: Answer = S1_CANONICAL;
export const SAMPLE_DEFERRAL: Deferral = S1_SPECULATIVE_DEFERRAL;

export const STREAMING_RETRIEVAL: readonly RetrievalStep[] = [
  { source: "Tafsir As-Sadi", status: "done", meta: "4 passages" },
  { source: "Tafsir Ibn Kathir", status: "done", meta: "3 passages" },
  { source: "Tafsir al-Qurtubi", status: "active", meta: "searching…" },
  { source: "Sunnah corpus", status: "pending", meta: "queued" },
];

export const STREAMING_TEXT =
  "The phrase ma waddaaka rabbuka — 'your Lord has not forsaken you' — uses a verb (waddaa) whose ordinary use is parting between two who love each other. The classical commentators read this carefully: the negation is not just 'God hasn't left,' it's 'God hasn't even";

// Helpers for callers (e.g. DemoStateBar) that want to cycle scenarios.
export function findScenario(id: string): AskScenario | undefined {
  return ASK_SCENARIOS.find((scenario) => scenario.id === id);
}

export function defaultVariantFor(scenario: AskScenario): AskScenarioVariant {
  // Each scenario's first variant is the canonical phrasing.
  const first = scenario.variants[0];
  if (!first) {
    throw new Error(`Scenario ${scenario.id} has no variants`);
  }
  return first;
}
