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
