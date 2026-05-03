import type { SlashCommand } from "@/types";

// Slash-command registry. Discovery + filtering source of truth for both the
// Journal slash menu (`SlashCommandMenu`) and the Ask slash menu (`SlashMenu`
// in `components/Ask/Ask.tsx`), which whitelists a different subset via the
// `allowedIds` prop.
//
// Convention: `trigger` is the typed string after `/`. `name` is the human
// label rendered in the menu. `iconName` lets the menu render via the
// Icon component map without dragging a React import into the registry.
//
// The Ask power commands (scope/sources/compare/clear) are side-effects:
// the consumer inspects the id and routes to the matching store action
// rather than going through a runner. They live here so the registry stays
// the single source of truth.

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
  {
    id: "scope",
    trigger: "scope",
    name: "/scope",
    description: "Change the active scope (surah / verse range).",
    iconName: "compass",
    category: "transform",
  },
  {
    id: "sources",
    trigger: "sources",
    name: "/sources",
    description: "Open the active sources panel.",
    iconName: "layers",
    category: "transform",
  },
  {
    id: "compare",
    trigger: "compare",
    name: "/compare",
    description: "Toggle between synthesized and by-source answer views.",
    iconName: "library",
    category: "transform",
  },
  {
    id: "clear",
    trigger: "clear",
    name: "/clear",
    description: "Clear the current conversation.",
    iconName: "x",
    category: "transform",
  },
];
