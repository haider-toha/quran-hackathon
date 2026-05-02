"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";

import {
  BookIcon,
  CompassIcon,
  type IconProps,
  LibraryIcon,
  NoteIcon,
  PenIcon,
  SearchIcon,
  SparkleIcon,
} from "@/components/Icon";
import { AD_DUHA, SAMPLE_NOTES } from "@/lib/mock-data";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { AppRoute } from "@/types";

type CommandKind = "nav" | "verse" | "note";

type Command = {
  id: string;
  kind: CommandKind;
  icon: ComponentType<IconProps>;
  label: string;
  sub: string;
  href: AppRoute;
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

export function CommandPalette({ onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const [lastQuery, setLastQuery] = useState(query);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();

    const verseCommands: readonly Command[] = AD_DUHA.verses.map((verse) => ({
      id: `v-${verse.number}`,
      kind: "verse" as const,
      icon: BookIcon,
      label: `Ad-Ḍuḥā 93:${verse.number}`,
      sub: verse.english,
      href: "/" as const,
    }));

    const noteCommands: readonly Command[] = SAMPLE_NOTES.slice(0, 5).map((note) => ({
      id: `n-${note.id}`,
      kind: "note" as const,
      icon: NoteIcon,
      label: note.title,
      sub: `${note.link} · ${note.tags.slice(0, 2).join(", ")}`,
      href: "/journal" as const,
    }));

    const all = [...NAV_COMMANDS, ...verseCommands, ...noteCommands].filter((item) => {
      if (!q) return true;
      return item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q);
    });

    const navItems = all.filter((c) => c.kind === "nav");
    const verseItems = all.filter((c) => c.kind === "verse");
    const noteItems = all.filter((c) => c.kind === "note");

    return [
      { label: "Navigate", items: navItems },
      { label: "Verses", items: verseItems },
      { label: "Notes", items: noteItems },
    ].filter((g) => g.items.length > 0);
  }, [query]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const runCommand = useCallback(
    (command: Command) => {
      router.push(command.href);
      onClose();
    },
    [router, onClose],
  );

  // Arrow keys + Enter move through the result list. Escape and Tab are
  // handled by `useDialogFocus` above.
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
          <span className="kbd-inline">esc</span>
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
            <span className="kbd-inline">↑↓</span> navigate
          </span>
          <span>
            <span className="kbd-inline">↵</span> open
          </span>
          <span>
            <span className="kbd-inline">esc</span> close
          </span>
          <span style={{ marginLeft: "auto" }}>Mishkāt</span>
        </div>
      </div>
    </div>
  );
}
