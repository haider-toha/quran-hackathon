export type NoteTag = string;

export type Note = {
  id: string;
  title: string;
  preview: string;
  body: string;
  link: string;
  tags: readonly NoteTag[];
  editedRelative: string;
  editedAbsolute: string;
  editedAt: string;
  hasAi: boolean;
  aiAssisted: boolean;
  templateId: string | null;
  dismissedSuggestions: readonly string[];
};
