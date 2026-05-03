"use client";

import { useMemo, type ComponentType } from "react";

import { type IconProps } from "@/components/Icon";
import type { AppRoute } from "@/types";

export type CommandKind = "nav" | "verse" | "note" | "create" | "recent";

export type Command = {
  id: string;
  kind: CommandKind;
  icon: ComponentType<IconProps>;
  label: string;
  sub: string;
  /** When set, navigation routes here. */
  href?: AppRoute | string;
  /** When set, runs an in-app side-effect instead of navigating. */
  action?: () => void;
};

export type CommandGroup = {
  label: string;
  items: readonly Command[];
};

type Inputs = {
  /** Trimmed (but not lower-cased) query string from the input. */
  trimmedQuery: string;
  /** Static recents (rebuilt only when the underlying recents change). */
  recentCommands: readonly Command[];
  /** Create-new commands (rebuilt when the query changes). */
  createCommands: readonly Command[];
  /** Static nav commands; passed in so callers can hoist as a module-level constant. */
  navCommands: readonly Command[];
  /** Pre-built verse commands (one per verse in scope; static across keystrokes). */
  verseCommands: readonly Command[];
  /** Pre-built note commands (static across keystrokes). */
  noteCommands: readonly Command[];
};

/**
 * Filter and group command-palette items by query. The verse / note / nav
 * lists are passed in pre-built so this hook only does the keystroke-bound
 * filtering work — never rebuilds the underlying lists themselves.
 */
export function useCommandFilter({
  trimmedQuery,
  recentCommands,
  createCommands,
  navCommands,
  verseCommands,
  noteCommands,
}: Inputs): readonly CommandGroup[] {
  return useMemo(() => {
    const q = trimmedQuery.toLowerCase();

    const matches = (item: Command): boolean => {
      if (q.length === 0) return true;
      return item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q);
    };

    const navItems = navCommands.filter(matches);
    const verseItems = verseCommands.filter(matches);
    const noteItems = noteCommands.filter(matches);

    const showRecents = q.length === 0 && recentCommands.length > 0;
    const totalContentMatches = navItems.length + verseItems.length + noteItems.length;
    // Show "Create new" when query is empty, when it begins with "new", or
    // when no other items matched. Always render in the same position.
    const showCreate = q.length === 0 || q.startsWith("new") || totalContentMatches === 0;

    const groups: readonly (CommandGroup | null)[] = [
      showRecents ? { label: "Recent", items: recentCommands } : null,
      navItems.length > 0 ? { label: "Navigate", items: navItems } : null,
      verseItems.length > 0 ? { label: "Verses", items: verseItems } : null,
      noteItems.length > 0 ? { label: "Notes", items: noteItems } : null,
      showCreate ? { label: "Create new", items: createCommands } : null,
    ];

    return groups.filter((g): g is CommandGroup => g !== null);
  }, [trimmedQuery, recentCommands, createCommands, navCommands, verseCommands, noteCommands]);
}
