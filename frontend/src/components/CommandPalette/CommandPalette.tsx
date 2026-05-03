"use client";

// CommandPalette — global ⌘K overlay. Mounted once at the AppShell root and
// driven by the `command-palette-store` so any caller (the keyboard
// shortcut, the sidebar search button, future menu entries) shares one
// open/close source of truth.
//
// Result groups follow the Phase 6 spec:
//   - Jump to       → primary nav routes (Library, Read, Ask, Journal,
//                     Research, Settings)
//   - Recent notes  → top 5 from `notes-store` overlay merged with
//                     SAMPLE_NOTES, most-recently-edited first
//   - Verses        → substring match against the in-scope surah
//                     (Ad-Duha) — surah name, transliteration, ref form
//                     "93", "93:3", or English translation text
//   - Settings      → small list of in-app toggles (theme, suggestions
//                     surface) that flip via the existing preferences
//                     hook
//
// Filtering is a simple lower-case substring + token match against
// `label` and `sub`. Verse refs additionally match against the bare
// number form "93:N" so a user can type `93:3` and reach Ad-Duha 93:3.
// If a group has zero matches it's hidden entirely.
//
// Keyboard:
//   - Arrow Up / Down      move highlight
//   - Enter                activate the highlighted entry
//   - Esc                  close the palette
//   - Click outside scrim  close the palette

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BookIcon,
  CompassIcon,
  LibraryIcon,
  MoonIcon,
  NoteIcon,
  PenIcon,
  SearchIcon,
  SettingsIcon,
  SparkleIcon,
  SunIcon,
  WandIcon,
  type IconProps,
} from "@/components/Icon";
import { kbdChord, kbdLabel } from "@/lib/kbd";
import { closeCommandPalette } from "@/lib/command-palette-store";
import { AD_DUHA, SAMPLE_NOTES } from "@/lib/mock-data";
import { readUserNotes } from "@/lib/notes-store";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { usePreferences } from "@/hooks/usePreferences";
import type { AppRoute, Note } from "@/types";
import type { ComponentType } from "react";

// ── Command shape ──────────────────────────────────────────────
// `kind` identifies which group an entry belongs to so the renderer can
// label rows consistently with the spec's group headings. `action`
// fires an in-process side-effect; `href` triggers a route push. Items
// always have at least one of those two.
type CommandKind = "nav" | "note" | "verse" | "setting";

type Command = {
  id: string;
  kind: CommandKind;
  icon: ComponentType<IconProps>;
  label: string;
  sub: string;
  href?: AppRoute | string;
  action?: () => void;
};

type CommandGroup = {
  label: string;
  items: readonly Command[];
};

// Static jump-to set. Hoisted out of the component so the array isn't
// rebuilt per keystroke — the contents never depend on local state.
const NAV_COMMANDS: readonly Command[] = [
  {
    id: "nav-library",
    kind: "nav",
    icon: LibraryIcon,
    label: "Library",
    sub: "Notes archive",
    href: "/library",
  },
  { id: "nav-read", kind: "nav", icon: BookIcon, label: "Read", sub: "Open the reader", href: "/" },
  {
    id: "nav-ask",
    kind: "nav",
    icon: SparkleIcon,
    label: "Ask",
    sub: "Ask a question",
    href: "/ask",
  },
  {
    id: "nav-journal",
    kind: "nav",
    icon: PenIcon,
    label: "Journal",
    sub: "Write and connect",
    href: "/journal",
  },
  {
    id: "nav-research",
    kind: "nav",
    icon: CompassIcon,
    label: "Research",
    sub: "Deep research workspace",
    href: "/research",
  },
  {
    id: "nav-settings",
    kind: "nav",
    icon: SettingsIcon,
    label: "Settings",
    sub: "Preferences and sources",
    href: "/settings",
  },
];

// Verse commands, pre-built once. Each entry has `tokens` joined into the
// `sub` so the substring filter can match against ref forms ("93", "93:3"),
// transliteration ("Ad-Duha", "Duha"), and the English line.
const VERSE_COMMANDS: readonly Command[] = AD_DUHA.verses.map((verse) => ({
  id: `verse-${AD_DUHA.number}-${verse.number}`,
  kind: "verse",
  icon: BookIcon,
  label: `${AD_DUHA.transliteration} ${AD_DUHA.number}:${verse.number}`,
  sub: `${AD_DUHA.number}:${verse.number} · ${verse.english}`,
  // The reader picks up `?surah=N&ayah=K` and scrolls there.
  href: `/?surah=${AD_DUHA.number}&ayah=${verse.number}`,
}));

type Props = {
  /** Caller passes `closeCommandPalette` from the store. The component
   *  keeps the prop indirection so consumers can still mount the palette
   *  with a custom close handler if needed (e.g. tests). */
  onClose?: () => void;
};

export function CommandPalette({ onClose }: Props) {
  const router = useRouter();
  const closePalette = useCallback(() => {
    if (onClose) onClose();
    else closeCommandPalette();
  }, [onClose]);

  const { preferences, setPreference, toggleTheme } = usePreferences();
  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const [lastQuery, setLastQuery] = useState(query);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recent notes — top 5 by editedAt desc, drawn from the user store
  // overlay merged with SAMPLE_NOTES. Read once on mount; the palette is
  // short-lived so we don't subscribe.
  const [recentNotes] = useState<readonly Note[]>(() => {
    const userNotes = readUserNotes();
    const merged = [...userNotes, ...SAMPLE_NOTES];
    // Stable sort by editedAt desc (ISO-8601 strings sort lexicographically).
    const sorted = [...merged].sort((a, b) => (a.editedAt < b.editedAt ? 1 : -1));
    return sorted.slice(0, 5);
  });

  // Reset focus to the top of the result list whenever the query changes.
  // React 19 "derive state from changing prop/state" pattern — same idiom
  // the previous palette implementation used.
  if (lastQuery !== query) {
    setLastQuery(query);
    setFocusIndex(0);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useDialogFocus(dialogRef, { onEscape: closePalette });

  const trimmedQuery = query.trim();

  // ── Recent-notes commands ────────────────────────────────────
  // Routes back to the journal with the note id so JournalV2 picks it up.
  const noteCommands = useMemo<readonly Command[]>(
    () =>
      recentNotes.map((note) => ({
        id: `note-${note.id}`,
        kind: "note",
        icon: NoteIcon,
        label: note.title || "Untitled note",
        sub: note.link
          ? `${note.link}${note.tags.length > 0 ? ` · ${note.tags.slice(0, 2).join(", ")}` : ""}`
          : note.tags.slice(0, 2).join(", ") || "Note",
        href: `/journal?note=${encodeURIComponent(note.id)}`,
      })),
    [recentNotes],
  );

  // ── Settings commands ────────────────────────────────────────
  // In-process toggles. Each `action` mutates persisted state via the
  // shared preferences hook so the change survives reload.
  const settingCommands = useMemo<readonly Command[]>(() => {
    const isDark = preferences.theme === "dark";
    const suggestionsOff = preferences.suggestionsSurface === "off";
    return [
      {
        id: "setting-theme",
        kind: "setting",
        icon: isDark ? SunIcon : MoonIcon,
        label: "Toggle theme",
        sub: isDark ? "Switch to light" : "Switch to dark",
        action: () => {
          toggleTheme();
          closePalette();
        },
      },
      {
        id: "setting-suggestions",
        kind: "setting",
        icon: WandIcon,
        label: "Toggle suggestions",
        sub: suggestionsOff ? "Turn on suggestions rail" : "Turn off suggestions rail",
        action: () => {
          setPreference("suggestionsSurface", suggestionsOff ? "rail" : "off");
          closePalette();
        },
      },
    ];
  }, [preferences.theme, preferences.suggestionsSurface, toggleTheme, setPreference, closePalette]);

  // ── Filter ───────────────────────────────────────────────────
  // Lower-case substring match against `label + sub`. Verse rows already
  // include the ref form in `sub`, so users can type `93:3` directly.
  const groups = useMemo<readonly CommandGroup[]>(() => {
    const q = trimmedQuery.toLowerCase();
    const matches = (item: Command): boolean => {
      if (q.length === 0) return true;
      return item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q);
    };

    const navItems = NAV_COMMANDS.filter(matches);
    const noteItems = noteCommands.filter(matches);
    const verseItems = VERSE_COMMANDS.filter(matches);
    const settingItems = settingCommands.filter(matches);

    const built: readonly (CommandGroup | null)[] = [
      navItems.length > 0 ? { label: "Jump to", items: navItems } : null,
      noteItems.length > 0 ? { label: "Recent notes", items: noteItems } : null,
      verseItems.length > 0 ? { label: "Verses", items: verseItems } : null,
      settingItems.length > 0 ? { label: "Settings", items: settingItems } : null,
    ];
    return built.filter((g): g is CommandGroup => g !== null);
  }, [trimmedQuery, noteCommands, settingCommands]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const runCommand = useCallback(
    (command: Command) => {
      if (command.action) {
        command.action();
        return;
      }
      if (command.href !== undefined) {
        router.push(command.href);
        closePalette();
      }
    },
    [router, closePalette],
  );

  // Arrow keys move highlight; Enter activates. Escape and Tab are wired
  // through `useDialogFocus`. We listen on the document so the keys work
  // even if focus has wandered out of the input (e.g. user clicks the
  // scrim region briefly).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusIndex((i) => Math.min(flat.length - 1, i + 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusIndex((i) => Math.max(0, i - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const item = flat[focusIndex];
        if (item) runCommand(item);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [flat, focusIndex, runCommand]);

  return (
    <div
      className="command-palette command-palette-scrim"
      role="presentation"
      onMouseDown={(event) => {
        // Outside-click closes. The card stops propagation so clicks
        // inside the input / list region don't bubble to the scrim.
        if (event.target === event.currentTarget) closePalette();
      }}
    >
      <div
        ref={dialogRef}
        className="command-palette-card"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="command-palette-input">
          <SearchIcon size={15} />
          <input
            ref={inputRef}
            placeholder="Search verses, notes, sources, or jump to…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="kbd-inline">{kbdLabel("esc")}</span>
        </div>
        <div className="command-palette-list">
          {groups.length === 0 && (
            <div className="command-palette-empty">No results for &ldquo;{query}&rdquo;</div>
          )}
          {groups.map((group, gi) => {
            const offset = groups.slice(0, gi).reduce((acc, g) => acc + g.items.length, 0);
            return (
              <div key={group.label} className="command-palette-group">
                <div className="command-palette-group-head">{group.label}</div>
                {group.items.map((item, ii) => {
                  const idx = offset + ii;
                  const Icon = item.icon;
                  const active = idx === focusIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={clsx("command-palette-result", active && "active")}
                      onMouseEnter={() => setFocusIndex(idx)}
                      onClick={() => runCommand(item)}
                    >
                      <span className="ic">
                        <Icon size={14} />
                      </span>
                      <span className="col">
                        <span className="ttl">{item.label}</span>
                        <span className="sub">{item.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="command-palette-foot">
          <span>
            <span className="kbd-inline">{kbdLabel("up")}</span>
            <span className="kbd-inline">{kbdLabel("down")}</span> navigate
          </span>
          <span>
            <span className="kbd-inline">{kbdLabel("enter")}</span> open
          </span>
          <span>
            <span className="kbd-inline">{kbdLabel("esc")}</span> close
          </span>
          <span style={{ marginLeft: "auto" }}>{kbdChord("cmd", "K")} · Mishkat</span>
        </div>
      </div>
    </div>
  );
}
