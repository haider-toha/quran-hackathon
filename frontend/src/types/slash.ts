import type { IconName } from "@/components/Icon";

export type SlashCommandCategory = "search" | "insert" | "transform" | "generate";

export type SlashCommand = {
  id: string;
  trigger: string;
  name: string;
  description: string;
  iconName: IconName;
  category: SlashCommandCategory;
};

export type SlashCommandResultType =
  | "verse"
  | "tafsir-quote"
  | "summary"
  | "reflection"
  | "search-result";

export type SlashCommandResult = {
  type: SlashCommandResultType;
  content: string;
  source: { name: string; ref: string } | null;
  aiGenerated: boolean;
};
