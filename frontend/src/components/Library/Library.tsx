"use client";

import clsx from "clsx";
import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { LinkIcon, PlusIcon, SearchIcon, SparkleIcon, XIcon } from "@/components/Icon";
import { TemplatePicker } from "@/components/TemplatePicker/TemplatePicker";
import { usePreferenceLastRead } from "@/hooks/usePreferences";
import { createNoteFromTemplate, readUserNotes, subscribeUserNotes } from "@/lib/notes-store";
import type { Note, Template } from "@/types";

import { DateFilter, type DateRange } from "./DateFilter";
import { LibraryEmpty } from "./LibraryEmpty";
import { SortControl, type SortKey } from "./SortControl";
import { SurahFilter } from "./SurahFilter";
import { TagPopover } from "./TagPopover";

type Props = {
  notes: readonly Note[];
};

const EMPTY_NOTES: readonly Note[] = [];

// Subscribe Library to the user-notes store so newly-created notes appear
// without a route refresh. The server snapshot returns an empty list so
// SSR has nothing to hydrate against beyond the props-supplied notes.
function useUserNotes(): readonly Note[] {
  return useSyncExternalStore(
    subscribeUserNotes,
    () => readUserNotes(),
    () => EMPTY_NOTES,
  );
}

function parseSurahLink(link: string): number | null {
  if (!link) return null;
  const match = link.match(/^(\d+)/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) && num > 0 ? num : null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function inDateRange(editedAt: string, range: DateRange): boolean {
  if (range === "all") return true;
  const ts = Date.parse(editedAt);
  if (!Number.isFinite(ts)) return false;
  const diff = Date.now() - ts;
  if (diff < 0) return true;
  if (range === "today") return diff <= MS_PER_DAY;
  if (range === "week") return diff <= 7 * MS_PER_DAY;
  if (range === "month") return diff <= 30 * MS_PER_DAY;
  return true;
}

function compareForSort(a: Note, b: Note, sort: SortKey, currentSurah: number | null): number {
  if (sort === "alpha") return a.title.localeCompare(b.title);
  if (sort === "linked" && currentSurah !== null) {
    const aLinked = parseSurahLink(a.link) === currentSurah ? 0 : 1;
    const bLinked = parseSurahLink(b.link) === currentSurah ? 0 : 1;
    if (aLinked !== bLinked) return aLinked - bLinked;
  }
  const aTs = Date.parse(a.editedAt) || 0;
  const bTs = Date.parse(b.editedAt) || 0;
  return bTs - aTs;
}

type RecencyKey = "today" | "yesterday" | "thisWeek" | "earlierMonth" | "older";
type RecencyGroup = { key: RecencyKey; label: string; notes: readonly Note[] };

const GROUP_ORDER: readonly RecencyKey[] = [
  "today",
  "yesterday",
  "thisWeek",
  "earlierMonth",
  "older",
];

const GROUP_LABELS: Record<RecencyKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This week",
  earlierMonth: "Earlier this month",
  older: "Older",
};

function bucketForNote(note: Note): RecencyKey {
  const ts = Date.parse(note.editedAt);
  if (!Number.isFinite(ts)) return "older";
  const diff = Date.now() - ts;
  if (diff <= MS_PER_DAY) return "today";
  if (diff <= 2 * MS_PER_DAY) return "yesterday";
  if (diff <= 7 * MS_PER_DAY) return "thisWeek";
  if (diff <= 30 * MS_PER_DAY) return "earlierMonth";
  return "older";
}

function groupByRecency(notes: readonly Note[]): readonly RecencyGroup[] {
  const buckets = new Map<RecencyKey, Note[]>();
  for (const key of GROUP_ORDER) buckets.set(key, []);
  for (const note of notes) {
    const list = buckets.get(bucketForNote(note));
    if (list) list.push(note);
  }
  const groups: RecencyGroup[] = [];
  for (const key of GROUP_ORDER) {
    const list = buckets.get(key);
    if (list && list.length > 0) {
      groups.push({ key, label: GROUP_LABELS[key], notes: list });
    }
  }
  return groups;
}

// Distinct surahs and the most recent edited timestamp — used by the
// header subtitle (Phase 6).
function summariseHeader(notes: readonly Note[]): {
  total: number;
  surahCount: number;
  mostRecentRel: string;
} {
  const surahs = new Set<number>();
  let mostRecentTs = 0;
  let mostRecentRel = "";
  for (const note of notes) {
    const surah = parseSurahLink(note.link);
    if (surah !== null) surahs.add(surah);
    const ts = Date.parse(note.editedAt) || 0;
    if (ts > mostRecentTs) {
      mostRecentTs = ts;
      mostRecentRel = note.editedRelative;
    }
  }
  return { total: notes.length, surahCount: surahs.size, mostRecentRel };
}

export function Library({ notes }: Props) {
  const userNotes = useUserNotes();
  const merged = useMemo<readonly Note[]>(() => [...userNotes, ...notes], [notes, userNotes]);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedSurahs, setSelectedSurahs] = useState<readonly number[]>([]);
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [aiOnly, setAiOnly] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const surahOptions = useMemo<readonly number[]>(() => {
    const set = new Set<number>();
    for (const note of merged) {
      const surah = parseSurahLink(note.link);
      if (surah !== null) set.add(surah);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [merged]);

  const tagOptions = useMemo<readonly string[]>(() => {
    const set = new Set<string>();
    for (const note of merged) for (const tag of note.tags) set.add(tag);
    return Array.from(set).sort();
  }, [merged]);

  const lastRead = usePreferenceLastRead();
  const lastReadSurah = lastRead?.surah ?? null;

  const filteredNotes = useMemo<readonly Note[]>(() => {
    const q = deferredQuery.trim().toLowerCase();
    const filtered = merged.filter((note) => {
      if (selectedSurahs.length > 0) {
        const surah = parseSurahLink(note.link);
        if (surah === null || !selectedSurahs.includes(surah)) return false;
      }
      if (selectedTags.length > 0) {
        if (!selectedTags.some((tag) => note.tags.includes(tag))) return false;
      }
      if (!inDateRange(note.editedAt, dateRange)) return false;
      if (aiOnly && !note.aiAssisted) return false;
      if (q.length > 0) {
        const haystack = [note.title, note.preview, note.tags.join(" "), note.link]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => compareForSort(a, b, sortKey, lastReadSurah));
  }, [
    merged,
    deferredQuery,
    selectedSurahs,
    selectedTags,
    dateRange,
    sortKey,
    aiOnly,
    lastReadSurah,
  ]);

  const isFiltering =
    deferredQuery.trim().length > 0 ||
    selectedSurahs.length > 0 ||
    selectedTags.length > 0 ||
    dateRange !== "all" ||
    aiOnly;

  const headerStats = useMemo(() => summariseHeader(merged), [merged]);

  const handleTemplateSelect = useCallback((template: Template | null): void => {
    const note = createNoteFromTemplate(template);
    // Hard navigation so the Journal page mounts fresh with the new note id.
    if (typeof window !== "undefined") {
      window.location.href = `/journal?note=${encodeURIComponent(note.id)}`;
    }
  }, []);

  // "N" anywhere on the Library page opens the new-note flow (Phase 5).
  // Skip when focus is inside an editable field, when a modifier is held,
  // or when the picker is already open — we don't want it stealing N from
  // the search box or text inputs.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "n" && event.key !== "N") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      event.preventDefault();
      setPickerOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function clearAll(): void {
    setQuery("");
    setSelectedSurahs([]);
    setSelectedTags([]);
    setDateRange("all");
    setAiOnly(false);
  }

  const showEmptyState = merged.length === 0 && !isFiltering;
  if (showEmptyState) {
    return (
      <div className="lib2">
        <div className="lib2-inner">
          <Header stats={headerStats} onNewNote={() => setPickerOpen(true)} empty />
          <LibraryEmpty />
          <TemplatePicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={handleTemplateSelect}
          />
        </div>
      </div>
    );
  }

  const groupingActive = sortKey === "recent" && filteredNotes.length > 0;
  const groups = groupingActive ? groupByRecency(filteredNotes) : [];

  return (
    <div className="lib2">
      <div className="lib2-inner">
        <Header stats={headerStats} onNewNote={() => setPickerOpen(true)} />

        <div className="lib2-filterbar" role="group" aria-label="Filter notes">
          <div className="lib2-search">
            <SearchIcon size={13} />
            <input
              type="search"
              placeholder="Search notes by title, body, or verse…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search notes"
            />
          </div>

          <SurahFilter
            options={surahOptions}
            selected={selectedSurahs}
            onChange={setSelectedSurahs}
          />
          <DateFilter value={dateRange} onChange={setDateRange} />
          <SortControl value={sortKey} onChange={setSortKey} />
          <TagPopover options={tagOptions} selected={selectedTags} onChange={setSelectedTags} />
          <button
            type="button"
            className={clsx("lib2-filter-button lib2-ai-toggle", aiOnly && "on")}
            aria-pressed={aiOnly}
            onClick={() => setAiOnly((v) => !v)}
            title="Show only AI-assisted notes"
          >
            <SparkleIcon size={11} />
            <span>AI-assisted</span>
          </button>

          {isFiltering ? (
            <button type="button" className="lib2-clear-link" onClick={clearAll}>
              Clear all filters
            </button>
          ) : null}
        </div>

        {selectedTags.length > 0 ? (
          <div className="lib2-active-tags" role="group" aria-label="Active tag filters">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="lib2-active-chip"
                onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                aria-label={`Remove tag filter: ${tag}`}
              >
                <span className="lib2-active-chip-hash">#</span>
                {tag}
                <XIcon size={10} />
              </button>
            ))}
            <button
              type="button"
              className="lib2-clear-link lib2-clear-tags"
              onClick={() => setSelectedTags([])}
            >
              Clear
            </button>
          </div>
        ) : null}

        {filteredNotes.length === 0 ? (
          <div className="lib2-empty">
            <div className="lib2-empty-icon">
              <SearchIcon size={20} />
            </div>
            <div className="lib2-empty-title">No notes match your filters</div>
            <div className="lib2-empty-body">
              Try clearing a filter or searching by title, body, or a verse reference like{" "}
              <code className="lib2-mono-inline">93:3</code>.
            </div>
          </div>
        ) : groupingActive ? (
          <div className="lib2-list">
            {groups.map((group) => (
              <section key={group.key} className="lib2-group">
                <h2 className="lib2-group-label">{group.label}</h2>
                <div className="lib2-cards">
                  {group.notes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="lib2-list">
            <div className="lib2-cards">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}
      </div>

      <TemplatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}

type HeaderProps = {
  stats: { total: number; surahCount: number; mostRecentRel: string };
  onNewNote: () => void;
  empty?: boolean;
};

function Header({ stats, onNewNote, empty }: HeaderProps) {
  const { total, surahCount, mostRecentRel } = stats;
  const noteWord = total === 1 ? "note" : "notes";
  const surahWord = surahCount === 1 ? "surah" : "surahs";
  const subtitleParts: string[] = [];
  if (total > 0) {
    subtitleParts.push(`${total} ${noteWord} across ${surahCount} ${surahWord}`);
    if (mostRecentRel) subtitleParts.push(`last edited ${mostRecentRel}`);
  }
  const subtitle = subtitleParts.join(" · ");

  return (
    <>
      <header className="lib2-header">
        <div className="lib2-header-text">
          <h1 className="lib2-title">Notes</h1>
          {subtitle ? <p className="lib2-subtitle">{subtitle}</p> : null}
        </div>
        {empty ? null : (
          <button
            type="button"
            className="lib2-primary-btn"
            onClick={onNewNote}
            title="New note · press N"
          >
            <PlusIcon size={13} />
            <span>New note</span>
            <kbd className="lib2-keycap" aria-hidden>
              N
            </kbd>
          </button>
        )}
      </header>
      <hr className="lib2-rule" />
    </>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <Link
      href={`/journal?note=${encodeURIComponent(note.id)}`}
      className="lib2-card"
      aria-label={`Open note: ${note.title}`}
    >
      <div className="lib2-card-main">
        <div className="lib2-card-titlerow">
          <span className="lib2-card-title">{note.title}</span>
          {note.aiAssisted ? (
            <span className="lib2-card-ai" title="AI-assisted note" aria-label="AI-assisted note">
              <SparkleIcon size={11} />
            </span>
          ) : null}
        </div>
        <p className="lib2-card-preview">{note.preview}</p>
      </div>
      <div className="lib2-card-meta">
        {note.tags.length > 0 ? (
          <div className="lib2-card-tags">
            {note.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="lib2-card-tag">
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 ? (
              <span className="lib2-card-tag lib2-card-tag-more">+{note.tags.length - 3}</span>
            ) : null}
          </div>
        ) : null}
        {note.link ? (
          <span className="lib2-card-anchor" aria-label={`Anchored to verse ${note.link}`}>
            <LinkIcon size={10} />
            <span>{note.link}</span>
          </span>
        ) : null}
        <span className="lib2-card-time">{note.editedRelative}</span>
      </div>
    </Link>
  );
}
