import type { Template } from "@/types";

// 9 templates, drawn from spec §7.2. Each carries 3-5 sections; section type
// is a hint to the editor about what kind of insertion (free text, verse
// link, tafsir quote, reflection prompt) belongs there. `icon` is an
// IconName — consumers map it to a component via the Icon module.

export const TEMPLATES: readonly Template[] = [
  {
    id: "ayah-reflection",
    name: "Ayah reflection",
    description: "Sit with one verse. Quote, summarize, take it in.",
    icon: "reflect",
    sections: [
      {
        heading: "The verse",
        placeholder: "Paste or link the ayah you are reading.",
        type: "verse-link",
      },
      {
        heading: "What it says",
        placeholder: "A line of tafsir, in your own translation.",
        type: "tafsir-quote",
      },
      {
        heading: "What I notice",
        placeholder: "A first reading. No conclusions yet.",
        type: "text",
      },
      {
        heading: "What this asks of me",
        placeholder: "Where the verse lands, in your life today.",
        type: "reflection-prompt",
      },
    ],
  },
  {
    id: "thematic-study",
    name: "Thematic study",
    description: "Trace a theme across several verses and tafsirs.",
    icon: "book",
    sections: [
      {
        heading: "The theme",
        placeholder: "Mercy, patience, gratitude, the Day…",
        type: "text",
      },
      {
        heading: "Anchor verses",
        placeholder: "Two or three ayat that hold this theme together.",
        type: "verse-link",
      },
      {
        heading: "What the tafsirs say",
        placeholder: "Quotes from the commentaries that frame the theme.",
        type: "tafsir-quote",
      },
      {
        heading: "Where it converges",
        placeholder: "What is the same across the sources?",
        type: "text",
      },
      {
        heading: "Where it diverges",
        placeholder: "Where do the commentaries part ways?",
        type: "text",
      },
    ],
  },
  {
    id: "character-lessons",
    name: "Character lessons",
    description: "Read a prophet's story for what it teaches.",
    icon: "shield",
    sections: [
      {
        heading: "The figure",
        placeholder: "Whose story is this?",
        type: "text",
      },
      {
        heading: "The passage",
        placeholder: "The verses where the story appears.",
        type: "verse-link",
      },
      {
        heading: "Their character",
        placeholder: "What does the surah let you see in them?",
        type: "text",
      },
      {
        heading: "What I take from it",
        placeholder: "A lesson, named carefully.",
        type: "reflection-prompt",
      },
    ],
  },
  {
    id: "dua-extraction",
    name: "Dua extraction",
    description: "Pull a dua from the Quran and learn it.",
    icon: "quote",
    sections: [
      {
        heading: "The dua",
        placeholder: "Arabic and translation.",
        type: "verse-link",
      },
      {
        heading: "Context",
        placeholder: "Who is asking, and for what?",
        type: "text",
      },
      {
        heading: "What it teaches me to ask for",
        placeholder: "Frame the request in your own words.",
        type: "reflection-prompt",
      },
      {
        heading: "When to say it",
        placeholder: "Times, situations, intentions.",
        type: "text",
      },
    ],
  },
  {
    id: "names-of-allah",
    name: "Names of Allah",
    description: "Sit with one name. What it is, where it is, what it asks.",
    icon: "sparkle",
    sections: [
      {
        heading: "The name",
        placeholder: "Ar-Rahman, Al-Wadud, As-Sabur…",
        type: "text",
      },
      {
        heading: "Where it appears",
        placeholder: "Verses that name it directly.",
        type: "verse-link",
      },
      {
        heading: "What it means",
        placeholder: "From the tafsir corpus.",
        type: "tafsir-quote",
      },
      {
        heading: "How it shapes my prayer",
        placeholder: "What does this name change in how I ask?",
        type: "reflection-prompt",
      },
    ],
  },
  {
    id: "personal-action-points",
    name: "Personal action points",
    description: "From verse to practice. One step at a time.",
    icon: "check",
    sections: [
      {
        heading: "The verse",
        placeholder: "The ayah that prompted this note.",
        type: "verse-link",
      },
      {
        heading: "What it asks of me",
        placeholder: "Read the imperative carefully.",
        type: "text",
      },
      {
        heading: "One thing I will change",
        placeholder: "A concrete, small step.",
        type: "reflection-prompt",
      },
      {
        heading: "How I will know",
        placeholder: "What will tell me I followed through?",
        type: "text",
      },
    ],
  },
  {
    id: "comparative-tafsir",
    name: "Comparative tafsir",
    description: "Set the commentaries side by side and read them carefully.",
    icon: "library",
    sections: [
      {
        heading: "The verse",
        placeholder: "The ayah under study.",
        type: "verse-link",
      },
      {
        heading: "As-Sadi",
        placeholder: "What does As-Sadi say?",
        type: "tafsir-quote",
      },
      {
        heading: "Ibn Kathir",
        placeholder: "What does Ibn Kathir say?",
        type: "tafsir-quote",
      },
      {
        heading: "Al-Qurtubi",
        placeholder: "What does Al-Qurtubi say?",
        type: "tafsir-quote",
      },
      {
        heading: "What I read across them",
        placeholder: "Convergence, divergence, what stands.",
        type: "text",
      },
    ],
  },
  {
    id: "question-led-study",
    name: "Question-led study",
    description: "Begin with a question. Let the verses answer.",
    icon: "question",
    sections: [
      {
        heading: "The question",
        placeholder: "What are you actually asking?",
        type: "text",
      },
      {
        heading: "Where the Quran answers it",
        placeholder: "Verses that speak to this directly.",
        type: "verse-link",
      },
      {
        heading: "What the tafsirs add",
        placeholder: "Where the commentary fills in the picture.",
        type: "tafsir-quote",
      },
      {
        heading: "What I now think",
        placeholder: "An answer, held lightly.",
        type: "reflection-prompt",
      },
    ],
  },
  {
    id: "feeling-today",
    name: "How I'm feeling today",
    description: "Begin from where you are. Find the verse that meets you there.",
    icon: "note",
    sections: [
      {
        heading: "Where I am today",
        placeholder: "Name the feeling without judgement.",
        type: "text",
      },
      {
        heading: "A verse that meets me here",
        placeholder: "An ayah you keep coming back to.",
        type: "verse-link",
      },
      {
        heading: "What the tafsir reframes",
        placeholder: "How the commentary holds the feeling.",
        type: "tafsir-quote",
      },
      {
        heading: "What I will carry from this",
        placeholder: "One sentence to keep.",
        type: "reflection-prompt",
      },
    ],
  },
];
