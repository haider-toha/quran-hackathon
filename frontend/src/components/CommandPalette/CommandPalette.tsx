"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from "react";

import {
  BookIcon,
  CompassIcon,
  type IconProps,
  LibraryIcon,
  NoteIcon,
  PenIcon,
  PlusIcon,
  SearchIcon,
  SparkleIcon,
  TimeIcon,
} from "@/components/Icon";
import { TemplatePicker } from "@/components/TemplatePicker";
import { kbdChord, kbdLabel } from "@/lib/kbd";
import { AD_DUHA, SAMPLE_NOTES } from "@/lib/mock-data";
import { createNoteFromTemplate } from "@/lib/notes-store";
import { type RecentSearch, readRecents } from "@/lib/recents";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { AppRoute, Template } from "@/types";

type CommandKind = "nav" | "verse" | "note" | "create" | "recent";

type Command = {
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

const NAV_COMMANDS: readonly Command[] = [
  {
    id: "nav-read",
    kind: "nav",
    icon: BookIcon,
    label: "Read",
    sub: "Ad-Ḍuḥā 93",
    href: "/",
  },
  {
    id: "nav-ask",
    kind: "nav",
    icon: SparkleIcon,
    label: "Ask",
    sub: "New question",
    href: "/ask",
  },
  {
    id: "nav-journal",
    kind: "nav",
    icon: PenIcon,
    label: "Journal",
    sub: "On grief that comes in waves",
    href: "/journal",
  },
  {
    id: "nav-library",
    kind: "nav",
    icon: LibraryIcon,
    label: "Library",
    sub: "8 notes",
    href: "/library",
  },
  {
    id: "nav-research",
    kind: "nav",
    icon: CompassIcon,
    label: "Research",
    sub: "External — flagged amber",
    href: "/research",
  },
];

type Props = {
  onClose: () => void;
};

// Subscribe to localStorage recents so the surface re-renders if entries
// change while the palette is open. Reads return readonly RecentSearch[].
function useRecentsSnapshot(): readonly RecentSearch[] {
  return useSyncExternalStore(
    () => () => {},
    () => readRecents(),
    () => [],
  );
}

export function CommandPalette({ onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const [lastQuery, setLastQuery] = useState(query);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recents = useRecentsSnapshot();

  // React 19 "derive state from changing prop/state" pattern — reset focus
  // to the top of the result list whenever the query changes.
  if (lastQuery !== query) {
    setLastQuery(query);
    setFocusIndex(0);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useDialogFocus(dialogRef, { onEscape: onClose });

  const trimmedQuery = query.trim();

  const handleTemplateSelect = useCallback(
    (template: Template | null) => {
      const note = createNoteFromTemplate(template);
      setTemplatePickerOpen(false);
      router.push(`/journal?note=${encodeURIComponent(note.id)}`);
      onClose();
    },
    [router, onClose],
  );

  // Build the create-new commands. Each routes to a screen and (where it
  // makes sense) prefills with the current query.
  const createCommands = useMemo<readonly Command[]>(() => {
    const askHref = trimmedQuery.length > 0 ? `/ask?q=${encodeURIComponent(trimmedQuery)}` : "/ask";
    const researchHref =
      trimmedQuery.length > 0 ? `/research?q=${encodeURIComponent(trimmedQuery)}` : "/research";
    return [
      {
        id: "new-note",
        kind: "create",
        icon: PlusIcon,
        label: "New note",
        sub: "Pick a template",
        action: () => setTemplatePickerOpen(true),
      },
      {
        id: "new-question",
        kind: "create",
        icon: SparkleIcon,
        label: "New question in Ask",
        sub: trimmedQuery.length > 0 ? `Ask: “${trimmedQuery}”` : "Open Ask",
        href: askHref,
      },
      {
        id: "new-research",
        kind: "create",
        icon: CompassIcon,
        label: "New research query",
        sub: trimmedQuery.length > 0 ? `Research: “${trimmedQuery}”` : "Open Research",
        href: researchHref,
      },
    ];
  }, [trimmedQuery]);

  const recentCommands = useMemo<readonly Command[]>(
    () =>
      recents.slice(0, 5).map((entry) => ({
        id: `recent-${entry.id}`,
        kind: "recent" as const,
        icon: TimeIcon,
        label: entry.query,
        sub: entry.route === "/research" ? "Research" : "Ask",
        href:
          entry.route === "/research" || entry.route === "/ask"
            ? `${entry.route}?q=${encodeURIComponent(entry.query)}`
            : entry.route,
      })),
    [recents],
  );

  const groups = useMemo(() => {
    const q = trimmedQuery.toLowerCase();

    const verseCommands: readonly Command[] = AD_DUHA.verses.map((verse) => ({
      id: `v-${verse.number}`,
      kind: "verse" as const,
      icon: BookIcon,
      label: `Ad-Ḍuḥā 93:${verse.number}`,
      sub: verse.english,
      href: "/" as AppRoute,
    }));

    const noteCommands: readonly Command[] = SAMPLE_NOTES.slice(0, 5).map((note) => ({
      id: `n-${note.id}`,
      kind: "note" as const,
      icon: NoteIcon,
      label: note.title,
      sub: `${note.link} · ${note.tags.slice(0, 2).join(", ")}`,
      href: "/journal" as AppRoute,
    }));

    const matches = (item: Command): boolean => {
      if (q.length === 0) return true;
      return item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q);
    };

    const navItems = NAV_COMMANDS.filter(matches);
    const verseItems = verseCommands.filter(matches);
    const noteItems = noteCommands.filter(matches);

    const showRecents = q.length === 0 && recentCommands.length > 0;
    const totalContentMatches = navItems.length + verseItems.length + noteItems.length;
    // Show "Create new" when query is empty, when it begins with "new", or
    // when no other items matched. Always render in the same position.
    const showCreate = q.length === 0 || q.startsWith("new") || totalContentMatches === 0;

    return [
      showRecents ? { label: "Recent", items: recentCommands } : null,
      navItems.length > 0 ? { label: "Navigate", items: navItems } : null,
      verseItems.length > 0 ? { label: "Verses", items: verseItems } : null,
      noteItems.length > 0 ? { label: "Notes", items: noteItems } : null,
      showCreate ? { label: "Create new", items: createCommands } : null,
    ].filter((g): g is { label: string; items: readonly Command[] } => g !== null);
  }, [trimmedQuery, recentCommands, createCommands]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const runCommand = useCallback(
    (command: Command) => {
      if (command.action) {
        command.action();
        return;
      }
      if (command.href !== undefined) {
        router.push(command.href);
        onClose();
      }
    },
    [router, onClose],
  );

  // Arrow keys + Enter move through the result list. Escape and Tab are
  // handled by `useDialogFocus` above. Suspend list-key handling while the
  // template picker is open so its own keyboard handling can take over.
  useEffect(() => {
    if (templatePickerOpen) return;
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
  }, [flat, focusIndex, runCommand, templatePickerOpen]);

  return (
    <div
      className="cmdk-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cmdk-input">
          <SearchIcon size={15} />
          <input
            ref={inputRef}
            placeholder="Type a verse, ask a question, search notes…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="kbd-inline">{kbdLabel("esc")}</span>
        </div>
        <div className="cmdk-list">
          {groups.length === 0 && (
            <div
              style={{
                padding: "24px 16px",
                color: "var(--color-ink-4)",
                textAlign: "center",
                fontSize: 13,
              }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {groups.map((group, gi) => {
            const offset = groups.slice(0, gi).reduce((acc, g) => acc + g.items.length, 0);
            return (
              <div key={group.label}>
                <div className="cmdk-group-label">{group.label}</div>
                {group.items.map((item, ii) => {
                  const idx = offset + ii;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={clsx("cmdk-item", idx === focusIndex && "focus")}
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
        <div className="cmdk-foot">
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
          <span style={{ marginLeft: "auto" }}>{kbdChord("cmd", "K")} · Mishkāt</span>
        </div>
      </div>

      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}
