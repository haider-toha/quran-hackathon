import type { SlashCommand, SlashCommandResult } from "@/types";

// 5 commands from spec §8.2. The Journal slash menu opens on `/`.
//
// Convention: `trigger` is the typed string after `/`. `name` is the human
// label rendered in the menu. `iconName` lets the menu render via the
// Icon component map without dragging a React import into the registry.

export const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    id: "search",
    trigger: "search",
    name: "/search",
    description: "Search verses and tafsir for a topic.",
    iconName: "search",
    category: "search",
  },
  {
    id: "ayah",
    trigger: "ayah",
    name: "/ayah",
    description: "Insert a verse by reference (e.g. /ayah 93:3).",
    iconName: "book",
    category: "insert",
  },
  {
    id: "template",
    trigger: "template",
    name: "/template",
    description: "Insert a note template.",
    iconName: "note",
    category: "insert",
  },
  {
    id: "summarise",
    trigger: "summarise",
    name: "/summarise",
    description: "Summarise the section in two sentences.",
    iconName: "wand",
    category: "transform",
  },
  {
    id: "reflect",
    trigger: "reflect",
    name: "/reflect",
    description: "Generate a reflection prompt for the linked verse.",
    iconName: "reflect",
    category: "generate",
  },
];

// Mock async handler — pretends to talk to a backend so the UI feels real.
// 600ms delay matches the prototype's perceived latency. Returns plausible
// content with real Quran citations.

const DELAY_MS = 600;

function delay<T>(value: T, ms: number = DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const SEARCH_RESULT: SlashCommandResult = {
  type: "search-result",
  content:
    "Three matches across the corpus: 3:103 (the rope of Allah), 25:74 (the prayer for righteous offspring), 17:24 (lowering the wing of humility to one's parents).",
  source: { name: "Quran corpus", ref: "3:103, 25:74, 17:24" },
  aiGenerated: false,
};

const AYAH_93_3: SlashCommandResult = {
  type: "verse",
  content:
    "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ\n\nYour Lord has not forsaken you, nor does He hate you.",
  source: { name: "Surat Ad-Duha", ref: "93:3" },
  aiGenerated: false,
};

const SUMMARY_RESULT: SlashCommandResult = {
  type: "summary",
  content:
    "After a pause in revelation, the surah arrives as a direct response. The negation in verse 3 closes both possibilities — neither farewell nor displeasure — and reframes silence as preparation rather than absence.",
  source: { name: "Tafsir As-Sadi", ref: "93:3" },
  aiGenerated: true,
};

const REFLECT_RESULT: SlashCommandResult = {
  type: "reflection",
  content: "What does the silence in your own life teach you that words cannot?",
  source: null,
  aiGenerated: true,
};

/**
 * Run a slash command against mock content. The result type depends on the
 * command id, not the args (for now). Once a real backend is wired up, this
 * function becomes the single client-side entry point — its shape stays.
 */
export async function runSlashCommand(
  cmd: SlashCommand,
  args: string,
): Promise<SlashCommandResult> {
  const trimmed = args.trim();
  switch (cmd.id) {
    case "search":
      return delay(SEARCH_RESULT);
    case "ayah":
      // /ayah 93:3 returns the canonical Ad-Duha verse. Other refs return a
      // generic placeholder — wave-2 wires this to real surah data.
      if (trimmed === "93:3") return delay(AYAH_93_3);
      return delay({
        type: "verse",
        content: trimmed.length > 0 ? `(verse ${trimmed} would render here)` : AYAH_93_3.content,
        source: trimmed.length > 0 ? { name: "Quran corpus", ref: trimmed } : AYAH_93_3.source,
        aiGenerated: false,
      });
    case "template":
      return delay({
        type: "summary",
        content: "Pick a template from the inserter.",
        source: null,
        aiGenerated: false,
      });
    case "summarise":
      return delay(SUMMARY_RESULT);
    case "reflect":
      return delay(REFLECT_RESULT);
    default:
      return delay({
        type: "summary",
        content: "Command not implemented in the v3 mock.",
        source: null,
        aiGenerated: false,
      });
  }
}
