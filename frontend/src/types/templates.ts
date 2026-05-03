import type { IconName } from "@/components/Icon";

export type TemplateSectionType = "text" | "verse-link" | "tafsir-quote" | "reflection-prompt";

export type TemplateSection = {
  heading: string;
  placeholder: string;
  type: TemplateSectionType;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  sections: readonly TemplateSection[];
};
