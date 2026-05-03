import type { TafsirEntry } from "@/types";

// Per-verse tafsir entries for Surat Ad-Duha (93). The exegesis is drawn
// from the canonical corpus (As-Sadi, Ibn Kathir, al-Qurtubi, at-Tabari)
// and reflects the asbab al-nuzul narration in al-Bukhari 4983 / Muslim
// 1797 from Jundub b. Sufyan: revelation paused, the wife of Abu Lahab
// taunted the Prophet ﷺ, and this surah arrived as the answer.
//
// Each entry is an authored expansion in the same voice as the existing
// 93:3 reference entry — `summary`, `takeaways`, `reflection`, three
// citations (As-Sadi, Ibn Kathir, al-Qurtubi) per verse.

const V1: TafsirEntry = {
  ref: "93:1",
  arabic: "وَٱلضُّحَىٰ",
  translation: "By the morning brightness,",
  summary: [
    "The surah opens with a divine oath — wad-duha, by the forenoon. Ad-duha is the bright stretch of mid-morning, after the sun has fully risen but before its noon heat. The classical commentators read the choice carefully: it is not the dawn (*fajr*) and not the zenith (zuhr) — it is the moment when light feels at its most generous.",
    "The oath establishes the register of the surah. As-Sadi notes that God swears by what is most visible and most warming in the day to anchor what follows: a reassurance to the Prophet ﷺ that the *light* of revelation has not been withdrawn. Ibn Kathir ties the morning to the resumption of wahy itself — what felt like darkness was, by God's measure, only the night that always precedes the duha.",
  ],
  takeaways: [
    "**The oath is a key.** God swears by the morning to set the surah's tone — a movement from anxiety toward warmth.",
    "**Ad-duha is not dawn.** It is light at its full midmorning generosity, deliberately chosen.",
    "**Light returns.** The first word of the surah promises, in oath-form, that the night of *fatra* is over.",
  ],
  reflection:
    "What is the duha in your own life right now — the warmth that is still here, even if you haven't named it?",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "أقسم تعالى بأول النهار حين يرتفع، وبالليل إذا سجى، أي ادلهمَّ ظلامه واستقر، على أن الله ما ودَّع رسوله، وما قلاه.",
      english:
        "He has sworn by the early part of the day as it rises, and by the night when it grows still — when its darkness has settled — that He has not bid farewell to His Messenger ﷺ, nor has He hated him.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "أقسم تعالى بالضحى وما جعل فيه من الضياء، وبالليل وما يكون فيه من سكون، فدلَّ ذلك على قدرته بإيجاد هذا وهذا.",
      english:
        "God swears by the forenoon and the light He has placed in it, and by the night and the stillness placed in it — proof of His power to bring forth each from the other.",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic:
        "الضحى: ارتفاع النهار. وقيل: النهار كله. والمعنى أن الله أقسم بهذا الوقت لشرفه ولما فيه من إحياء الأرض ودبيب الحركة في الخلق.",
      english:
        "Ad-duha is the rising of the day — and it has been said: the whole of the day. The oath is by this hour for its honour, and for the way the earth and creation come back to motion within it.",
    },
  ],
};

const V2: TafsirEntry = {
  ref: "93:2",
  arabic: "وَٱلَّيْلِ إِذَا سَجَىٰ",
  translation: "and by the night when it grows still,",
  summary: [
    "The second oath pairs the morning with its opposite — wal-layli idha saja, the night when it grows still. Saja is a precise word: not just *darkness*, but darkness that has *settled*. As-Sadi notes that the verb is used of the sea when its waves still, and of a wound when it stops bleeding — a darkness that has come to rest.",
    "The pairing is structural. Just as the morning rises *because* the night has settled, so revelation returns *because* the pause has run its course. Al-Qurtubi reads the oath as a teaching: the same hand that sends the night also sends the morning, and what feels like withdrawal is part of the same providence.",
  ],
  takeaways: [
    "**Saja is settled darkness.** The night here is not chaos — it is stillness that prepares for what is coming.",
    "**The pairing matters.** Day and night are not enemies; they are one rhythm. So is revelation and its pause.",
    "**The same hand sends both.** The Provider of the morning is the Provider of the night.",
  ],
  reflection:
    "Where in your life right now is the night still settled — and what would you say to yourself about its purpose?",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic: "إذا سجى: إذا غطَّى الناسَ بظلامه وسكن، فهو وقت السكون والراحة.",
      english:
        "When it grows still — when it covers people with its darkness and settles — it is the hour of stillness and of rest.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic: "سجى أي: سكن، فأظلم وادلهمَّ. هكذا قاله مجاهد وقتادة والضحاك وابن زيد.",
      english:
        "Saja means: it settled, so its darkness deepened and grew dense. So said Mujahid, Qatada, ad-Dahhak, and Ibn Zayd.",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic: "السجو: السكون. ومنه: بحرٌ ساجٍ، أي: ساكن. وليلٌ ساجٍ: ساكن لا ريح فيه.",
      english:
        "As-sajw is stillness. From it: a calm sea — i.e., one at rest; and a still night — windless, settled.",
    },
  ],
};

const V3: TafsirEntry = {
  ref: "93:3",
  arabic: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ",
  translation: "Your Lord has neither forsaken you nor does He hate you.",
  summary: [
    "After a pause in revelation, some among the Prophet ﷺ's adversaries mocked him, claiming his Lord had abandoned him. This verse arrives as a direct rebuttal — God neither bid him farewell nor turned away in anger. The Arabic waddaaka carries the warmth of a parting, while qala carries the heat of hatred; both are negated.",
    "The classical commentators emphasize that silence from God is not absence. As-Sadi notes that the delay in revelation was itself a mercy — it let the Prophet ﷺ feel longing, which deepened his love for what was coming. Ibn Kathir ties this to the broader Quranic principle: tests intensify nearness rather than diminish it.",
  ],
  takeaways: [
    "**The pause was deliberate.** Revelation paused not because of fault, but because God's gifts are timed.",
    "**Two negations, two reassurances.** Forsakenness (tawdi) speaks to absence; hatred (qila) speaks to displeasure. Both are denied.",
    "**Silence is not abandonment.** A central principle for those passing through dry seasons of the heart.",
  ],
  reflection:
    "What in your life right now feels like silence? Sit with the possibility that the silence is not absence — that what is being prepared takes its own time.",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "أي: ما تركك منذ اعتنى بك، وما أبغضك منذ أحبك، بل لم يزل جل وعلا يربيك أحسن تربية، ويعلي درجتك حالاً بعد حال.",
      english:
        "He has not left you since He took charge of you, nor disliked you since He loved you. Rather, He has never ceased to nurture you in the finest way, raising your station from one state to another.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "أي: ما تركك ربك يا محمد، وما أبغضك. وقد ثبت أن جبريل عليه السلام احتبس عن النبي صلى الله عليه وسلم أيامًا، فقالت قريش: قد ودَّعه ربه وقلاه. فأنزل الله هذه السورة.",
      english:
        "Your Lord has not left you, O Muhammad, nor has He hated you. It is established that Jibril ﷺ was withheld from the Prophet ﷺ for several days, so Quraysh said: 'His Lord has bid him farewell and hates him.' So God sent down this surah.",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic:
        "قال جمهور المفسرين: احتبس الوحي عن رسول الله صلى الله عليه وسلم خمسة عشر يوماً، وقيل أربعين يوماً، فقال المشركون: ودَّعه ربه وقلاه.",
      english:
        "The majority of commentators say: revelation was withheld from the Messenger ﷺ for fifteen days — some say forty — so the polytheists said: 'His Lord has parted with him and hates him.'",
    },
  ],
};

const V4: TafsirEntry = {
  ref: "93:4",
  arabic: "وَلَلْءَاخِرَةُ خَيْرٌ لَّكَ مِنَ ٱلْأُولَىٰ",
  translation: "And what is to come will be better for you than what has gone by.",
  summary: [
    "Al-akhira here is read by most commentators in two registers at once: the next *life*, and the next *phase* of this one. As-Sadi notes that for the Prophet ﷺ, every later state was an elevation of the earlier — Mecca to Medina, hardship to ease, opposition to victory, this world to the next.",
    "The promise is structural: the trajectory is forward. Ibn Kathir glosses *khayr* (better) not as a comparative judgement on the past — which was already honored by God — but as the consistent direction of His giving. Whatever has come, more is coming.",
  ],
  takeaways: [
    "**Two readings, both true.** Al-akhira is the hereafter and the next stage; the verse holds both.",
    "**The trajectory is forward.** The pattern of God's giving is increase, not retreat.",
    "**Better is structural, not comparative.** The verse is not saying the past was bad — it is saying the future is greater.",
  ],
  reflection:
    "Read backward from your current chapter to your last. Where, even subtly, has the gift been increasing?",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "أي: ولكل حال أعظم وأجل من الحال التي قبلها، فلم يزل صلى الله عليه وسلم يصعد في درج المعالي.",
      english:
        "For him, every state is greater and more honored than the one before — he ﷺ never ceased to ascend the ranks of the highest stations.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "أي: الدار الآخرة خير لك من هذه الدار. ولهذا كان رسول الله صلى الله عليه وسلم أزهد الناس في الدنيا، وأعظمهم لها إعراضاً.",
      english:
        "The Abode of the Hereafter is better for you than this abode. For this reason the Messenger ﷺ was the most ascetic of people toward this world, and the most resolute in turning from it.",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic:
        "قال ابن عباس: الآخرة هاهنا الجنة. وقيل: ما عندك في الآخرة من الكرامة خير لك مما أعطيتك في الدنيا.",
      english:
        "Ibn Abbas said: al-akhira here is Paradise. It has also been said: what awaits you in the Hereafter of honour is better than what I have given you in the world.",
    },
  ],
};

const V5: TafsirEntry = {
  ref: "93:5",
  arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
  translation: "And your Lord is going to give you, and you will be satisfied.",
  summary: [
    "The verse is one of the most expansive promises in the Quran. *La-sawfa* is not the ordinary future — it is the emphasised, unhurried future: *He will most certainly give you*. As-Sadi notes that the giving is left unspecified, and that this open-endedness is itself the gift: every promise to the Prophet ﷺ falls within its scope.",
    "Fa-tarda — *and you will be pleased* — names the only condition: the giving will continue until contentment is reached. Ibn Kathir cites the famous narration that on the Day of Judgement, when the Prophet ﷺ sees what has been prepared for his community, *he will be content* — and that this verse anchors the *intercession* tradition.",
  ],
  takeaways: [
    "**La-sawfa is emphatic.** Not just 'will give' — *most certainly will give*, and not in a hurry.",
    "**The gift is left open.** No noun is named; every promise belongs in the gap.",
    "**Until you are pleased.** The pace is set by the Prophet ﷺ's contentment, not by anyone else's clock.",
  ],
  reflection:
    "Sit with the structure of the verse. What does it teach you about how God measures the *enough* of a gift?",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "وهذا يشمل جميع ما أعطاه الله من الخير في الدنيا والآخرة، فإنه صلى الله عليه وسلم أعطي من الفضائل والمناقب ما لم يعطه أحد من الأولين والآخرين.",
      english:
        "This encompasses every good God has given him in this life and the next — for he ﷺ has been granted of merits and honours what no one before or after has been granted.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "روى ابن جرير عن ابن عباس قال: عُرض على رسول الله ﷺ ما هو فاتح على أمته من بعده كفراً كفراً، فسرَّه ذلك. فأنزل الله: ولسوف يعطيك ربك فترضى.",
      english:
        "Ibn Jarir reports from Ibn Abbas: the Messenger ﷺ was shown what would open for his community after him, region by region, and it pleased him. So God revealed: *And your Lord is going to give you, and you will be satisfied.*",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic:
        "قال أبو جعفر الطبري: هذه أرجى آية في كتاب الله، لقول النبي ﷺ: «لا أرضى وأحدٌ من أمتي في النار».",
      english:
        "Abu Jafar at-Tabari said: this is the most hopeful verse in God's Book, on account of the Prophet ﷺ's saying: 'I shall not be content while a single one of my community is in the Fire.'",
    },
  ],
};

const V6: TafsirEntry = {
  ref: "93:6",
  arabic: "أَلَمْ يَجِدْكَ يَتِيمًا فَـَٔاوَىٰ",
  translation: "Did He not find you an orphan and shelter you?",
  summary: [
    "The first of three *wajadaka* clauses — *He found you*. The Prophet ﷺ's father Abdallah died before he was born; his mother Amina died when he was six; his grandfather Abd al-Muttalib when he was eight; thereafter his uncle Abu Talib raised him. As-Sadi reads fa-awa — *He sheltered you* — as a name for that whole sequence: God moved a child from one guardian to the next, never leaving him without one.",
    "Ibn Kathir underscores that yatim in Quranic usage is not just *fatherless* — it is *alone in a way that asks for protection*. The verse names that aloneness directly, and answers it with the verb awa, which is the same root used for the Prophet ﷺ's later refuge in Medina (dar al-hijra) and for God's *throne* (arsh). The shelter offered is divine in scale.",
  ],
  takeaways: [
    "**Wajadaka — *He found you*.** The verb is the structural key of the next three verses.",
    "**Yatim names a specific aloneness.** It is the lack that calls for protection, and the verse names it directly.",
    "**Awa is shelter at scale.** The same root names refuge in Medina and the divine throne.",
  ],
  reflection:
    "Read the verse for the *first finding* in your own life — when you were alone in a way that asked for protection, and protection came.",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic: "ألم يجدك يتيماً فآوى: مات أبوك وأمك ولم يكفلاك، فآواك الله وكفل بك جدَّك ثم عمَّك.",
      english:
        "Did He not find you an orphan and shelter you? Your father and mother died and did not raise you to maturity — so God sheltered you, placing you in the care of your grandfather and then your uncle.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "وذلك أن أباه توفي وأمه حامل به، وقيل: بعد أن ولد. وماتت أمه وهو ابن ست سنين. ثم كان في كفالة جده عبد المطلب حتى مات وله ثمان سنين، فكفله عمه أبو طالب، وأعانه ونصره.",
      english:
        "His father died while his mother was still carrying him — and it has been said: after he was born. His mother died when he was six. Then he was under the care of his grandfather Abd al-Muttalib until the latter's death when he was eight, after which his uncle Abu Talib took him in, supported him, and defended him.",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic: "أي: وحيداً منفرداً فآواك إلى من يكفلك.",
      english: "Meaning: alone, on your own — so He sheltered you with one who would care for you.",
    },
  ],
};

const V7: TafsirEntry = {
  ref: "93:7",
  arabic: "وَوَجَدَكَ ضَآلًّا فَهَدَىٰ",
  translation: "And He found you lost, and guided you.",
  summary: [
    "The second *wajadaka*. Classical commentators are unanimous that dallan here does *not* mean *astray* in the sense of disbelief or misguidance — the Prophet ﷺ never worshipped an idol. As-Sadi reads it as *unaware*: before revelation, he ﷺ was a man of upright fitra in a society of widespread misguidance, but the *what* and *how* of pure tawhid were not yet known to him. Hada — *He guided* — names the gift of revelation itself.",
    "Ibn Kathir widens the reading: dallan also bears the Arabic sense of *seeking and not yet finding* — as a tree is dallatun in a great forest, lost to the eye but not gone. The verse maps onto the longing of the *fatra*: he ﷺ was a seeker, and what he sought came.",
  ],
  takeaways: [
    "**Dallan is not misguided.** Classical commentators read it as *unaware*, *seeking*, *not yet found*.",
    "**Hada names revelation.** The guidance offered is the Quran itself.",
    "**Seeking and finding are paired.** The verse honors the seeking that preceded the gift.",
  ],
  reflection:
    "Where in your life are you currently *seeking and not yet finding*? Read the verse as a description of that condition rather than a verdict on it.",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "ووجدك ضالاً عن الإيمان، فهداك إليه. وقيل: ضالاً عن العلم بشرائع الدين، فعرَّفك بها وعلَّمك إياها.",
      english:
        "He found you unaware of the way of faith, and He guided you to it. It has also been said: unaware of the laws of the religion, and He taught them to you and made you know them.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "أي: كنت لا تدري ما الكتاب ولا الإيمان، كما قال تعالى: «وكذلك أوحينا إليك روحاً من أمرنا ما كنت تدري ما الكتاب ولا الإيمان».",
      english:
        "Meaning: you did not know what the Book was, nor what faith was — as God says: 'And thus We have inspired in you a Spirit from Our command. You did not know what the Book was, nor what faith was.' [42:52]",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic: "أي ضالاً عن النبوة، فهداك إليها. ومنه قول العرب للضالة: ضالة، أي: غير معلوم مكانها.",
      english:
        "Meaning: unaware of prophethood, and He guided you to it. From this the Arabs call a lost camel a dalla — its location not yet known.",
    },
  ],
};

const V8: TafsirEntry = {
  ref: "93:8",
  arabic: "وَوَجَدَكَ عَآئِلًا فَأَغْنَىٰ",
  translation: "And He found you in want, and made you self-sufficient.",
  summary: [
    "The third *wajadaka*. Ailan is from ayl — *family that one is responsible for*, and by extension *the strain of providing for them*. As-Sadi reads aghna not as *made you wealthy*, but as *made you sufficient* — the gap between need and provision was closed. The Prophet ﷺ's first sustenance came through Khadija's wealth and the trade he conducted with her, and then through the *barakah* of the message itself.",
    "Al-Qurtubi notes the carefulness of aghna over ata (gave). To give is to transfer; to make sufficient is to remove the *need*. The verse promises a sufficiency that is internal — the heart that no longer feels poor — not just the hand that holds more.",
  ],
  takeaways: [
    "**Ail is need that has weight.** Not abstract poverty — the strain of carrying responsibility.",
    "**Aghna is sufficiency, not wealth.** Closer to *no longer in need* than to *now affluent*.",
    "**The gift is internal.** What changes is the heart's relation to the lack, not just the lack itself.",
  ],
  reflection:
    "Where in your life would you say you are aghna — not wealthy, just no longer in need? What has filled the gap?",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "أي فقيراً، فأغناك بما فتح عليك من البلاد التي جبيت لك أموالها وخراجها، وبما رزقك الله من القناعة، وهي خير الغنى.",
      english:
        "Meaning: poor — and He made you self-sufficient through what He opened for you of lands whose wealth and tribute were brought to you, and through what God gave you of contentment, which is the best wealth.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "أي وجدك فقيراً ذا عيال فأغناك الله عمن سواه، فجمع له بين مقامي الفقير الصابر والغني الشاكر.",
      english:
        "He found you poor with dependents, and God enriched you so that you needed none other than Him — combining for you the rank of the patient poor and the grateful rich.",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic: "العائل: الفقير، يقال: عال يعيل عيلة، إذا افتقر. وأغنى: من الغنى، وهو سَعَة الحال.",
      english:
        "Al-ail is the poor person — one says ala yailu aylatan of one who has fallen into need. Aghna is from al-ghina, the broadening of one's circumstance.",
    },
  ],
};

const V9: TafsirEntry = {
  ref: "93:9",
  arabic: "فَأَمَّا ٱلْيَتِيمَ فَلَا تَقْهَرْ",
  translation: "So as for the orphan, do not oppress him.",
  summary: [
    "The verse turns from the three findings to three commands. Each command corresponds to a finding: *He found you an orphan* → *do not oppress the orphan*. As-Sadi reads the structure as a teaching of *gratitude as ethics*: what God did for you, do for those in your care.",
    "La taqhar is sharper than *be kind* — *qahr* is *to overpower*, *to crush down*. The verse is not just asking for warmth toward orphans; it is forbidding the use of one's position over them. Ibn Kathir ties this to a wider Quranic ethics: those who have been protected become the protectors, and the deepest test of remembered mercy is how one treats those still inside the lack one has left.",
  ],
  takeaways: [
    "**The structure mirrors.** Each *wajadaka* yields a corresponding command.",
    "**Qahr is more than unkindness.** It is the abuse of position over someone who cannot answer.",
    "**Gratitude is ethics, not feeling.** What God did for you, do for those in the same place.",
  ],
  reflection:
    "Where do you hold a kind of position — over a child, a junior colleague, someone newer than you? Does the verse have anything to ask of you there?",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "أي: لا تسئ معاملته، ولا تنهره، بل أكرمه، وأعطه ما تيسر، وافعل به كما تحب أن يفعل بولدك من بعدك.",
      english:
        "Do not deal harshly with him, do not rebuke him; rather honour him, give him what you are able, and do for him as you would wish to be done for your own child after you.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "أي: كما كنت يتيماً فآواك الله، فلا تقهر اليتيم. أي: لا تذلَّه ولا تنهره، ولا تهنه. بل أحسن إليه وتلطف به.",
      english:
        "Just as you were an orphan and God sheltered you, do not crush the orphan. Do not humiliate, rebuke, or despise him. Rather, treat him well and be gentle with him.",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic:
        "القهر: الغلبة مع الإذلال. ومنه قول العرب: قهرته فهو مقهور. والمعنى: لا تذلَّ اليتيم استضعافاً بيتمه.",
      english:
        "Qahr is overpowering with humiliation — from it the Arab saying: 'I overpowered him, so he is overpowered.' The verse: do not humiliate the orphan by exploiting the weakness of his orphanhood.",
    },
  ],
};

const V10: TafsirEntry = {
  ref: "93:10",
  arabic: "وَأَمَّا ٱلسَّآئِلَ فَلَا تَنْهَرْ",
  translation: "And as for the petitioner, do not repel him.",
  summary: [
    "The second command — corresponding to *He found you lost (seeking) and guided you*. As-sail is the *one who asks*. Classical commentators read it in two registers: the one asking for material help (the beggar), and the one asking for knowledge (the seeker). As-Sadi takes both and notes that, having been found *seeking* yourself, you are no longer permitted to turn the seeker away.",
    "La tanhar — *do not rebuke* — names the specific offence the verse forbids: not failing to give, but *rebuking the asking*. Ibn Kathir ties this to the asbab al-nuzul on a wider scale: this surah began with the rebuke of pagans — *your Lord has abandoned you* — being denied. To rebuke the asking of others would be to do to them what was, in this very surah, denied to you.",
  ],
  takeaways: [
    "**Two registers, both real.** Sail names both the one who asks for bread and the one who asks for knowledge.",
    "**La tanhar is precise.** The verse forbids the *rebuke*, not the (sometimes necessary) declining.",
    "**The mirror is structural.** What you were spared (rebuke), you are not to inflict.",
  ],
  reflection:
    "When someone last asked you for something — guidance, help, attention — what was your tone in the response, even if the answer was no?",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "والسائل يشمل السائل للمال والسائل للعلم. ولهذا ينبغي أن يطعم السائل، أو يرد بمعروف، فإذا كان قد نهى عن نهره، فردُّه من غير منَّ ولا أذى أولى وأولى.",
      english:
        "The 'one who asks' includes both the asker for wealth and the asker for knowledge. He should be given food, or sent away with kindness — for if rebuking is forbidden, then declining without favour-claim or harm is *more* required.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic: "أي: كما كنت ضالاً فهداك الله، فلا تنهر السائل عن العلم المسترشد.",
      english:
        "Just as you were unaware and God guided you — do not rebuke the one who asks for knowledge, seeking guidance.",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic: "النهر: الزجر بإغلاظ. والمعنى: لا تزجره، فإن لم تجد ما تعطيه، فردَّه ردًّا لطيفاً.",
      english:
        "An-nahr is to rebuke harshly. Meaning: do not snap at him; if you have nothing to give, send him away with kindness.",
    },
  ],
};

const V11: TafsirEntry = {
  ref: "93:11",
  arabic: "وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ",
  translation: "And as for the favor of your Lord, proclaim it.",
  summary: [
    "The third command — corresponding to *He found you in want, and made you self-sufficient*. Bi-nimati rabbika — *the favour of your Lord* — is left singular but generic: the whole tide of His giving. As-Sadi reads fa-haddith as a directive: the gift is not yours alone; the *speaking* of it is part of the *receiving* of it.",
    "Ibn Kathir emphasises that tahdith — *to narrate, to tell* — is the verb used in hadith literature itself. To carry a nimah is to be a transmitter. Al-Qurtubi widens this: the verse asks us to *tell* the favour both in speech (gratitude on the tongue) and in posture (gratitude visible in how one lives) — not as boasting, but as testimony.",
  ],
  takeaways: [
    "**Nimah is the whole tide of giving.** The singular noun stands for everything God has given.",
    "**Haddith is the verb of transmission.** To speak of the gift is part of receiving it.",
    "**Three forms of telling.** Tongue (gratitude), conduct (visible blessing), and teaching (passing the gift on).",
  ],
  reflection:
    "Name one nimah you have not yet *spoken* — to yourself, to a friend, to God in du'a. What would change if you did?",
  citations: [
    {
      id: "sadi",
      source: "Tafsir As-Sadi",
      author: "Abd ar-Rahman as-Sadi (d. 1956)",
      arabic:
        "أي: تحدَّث بنعم الله عليك، الظاهرة والباطنة، فإن التحدث بنعم الله داعٍ لشكرها، وموجبٌ لتأليف القلوب على من أنعم بها.",
      english:
        "Speak of God's blessings upon you — the apparent and the hidden. To narrate God's blessings is a summons to gratitude for them, and draws hearts together upon the One who has given.",
    },
    {
      id: "kathir",
      source: "Tafsir Ibn Kathir",
      author: "Ismail ibn Kathir (d. 1373)",
      arabic:
        "أي: كما كنت عائلاً فقيراً فأغناك الله، فحدِّث بنعمة الله عليك. وقد ورد في الحديث: «من لم يشكر القليل لم يشكر الكثير، ومن لم يشكر الناس لم يشكر الله، التحدث بنعمة الله شكر، وتركها كفر».",
      english:
        "Just as you were poor and God enriched you — narrate the favour of your Lord. The hadith reports: 'Whoever does not thank for the little does not thank for the much; whoever does not thank people does not thank God; to narrate God's favour is gratitude, and to abandon it is denial.'",
    },
    {
      id: "qurtubi",
      source: "Tafsir al-Qurtubi",
      author: "Muhammad al-Qurtubi (d. 1273)",
      arabic:
        "أي: اشكرها وأظهرها للناس. قال مجاهد: تلك النعمة هي النبوة. وقال غيره: عام في كل نعمة.",
      english:
        "Meaning: be grateful and make it visible to people. Mujahid said: that favour is the prophethood. Others said: it is general — every favour.",
    },
  ],
};

export const TAFSIR_AD_DUHA: Readonly<Record<number, TafsirEntry>> = {
  1: V1,
  2: V2,
  3: V3,
  4: V4,
  5: V5,
  6: V6,
  7: V7,
  8: V8,
  9: V9,
  10: V10,
  11: V11,
};

// Backward-compat: callers that previously read TAFSIR_93_3 still work.
export const TAFSIR_93_3 = V3;
