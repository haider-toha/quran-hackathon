"use client";

import clsx from "clsx";
import { useDeferredValue, useMemo, useState, useSyncExternalStore } from "react";

import { GridIcon, ListIcon, PlusIcon, SearchIcon } from "@/components/Icon";
import { TemplatePicker } from "@/components/TemplatePicker/TemplatePicker";
import { createNoteFromTemplate, readUserNotes, subscribeUserNotes } from "@/lib/notes-store";
import { usePreferences } from "@/hooks/usePreferences";
import type { Note, Template } from "@/types";

import { DateFilter, type DateRange } from "./DateFilter";
import { LibraryEmpty } from "./LibraryEmpty";
import { NoteCard } from "./NoteCard";
import { NoteRow } from "./NoteRow";
import { SortControl, type SortKey } from "./SortControl";
import { SurahFilter } from "./SurahFilter";
import { TagFilter } from "./TagFilter";

type Props = {
  notes: readonly Note[];
};

const EMPTY_NOTES: readonly Note[] = [];

// Subscribe Library to the user-notes store so newly-created notes appear
// without a route refresh. The server-snapshot returns an empty list so SSR
// has nothing to hydrate against beyond the props-supplied SAMPLE_NOTES.
function useUserNotes(): readonly Note[] {
  return useSyncExternalStore(
    subscribeUserNotes,
    () => readUserNotes(),
    () => EMPTY_NOTES,
  );
}

// Parse a "93:3" or "93:3-5" link into its surah number, or `null` if the
// note has no link. Returning null lets the parent skip notes that don't
// participate in the surah filter.
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
  if (diff < 0) return true; // future-stamped (clock skew); keep visible.
  if (range === "today") return diff <= MS_PER_DAY;
  if (range === "week") return diff <= 7 * MS_PER_DAY;
  if (range === "month") return diff <= 30 * MS_PER_DAY;
  return true;
}

function compareForSort(a: Note, b: Note, sort: SortKey, currentSurah: number | null): number {
  if (sort === "alpha") {
    return a.title.localeCompare(b.title);
  }
  if (sort === "linked" && currentSurah !== null) {
    const aLinked = parseSurahLink(a.link) === currentSurah ? 0 : 1;
    const bLinked = parseSurahLink(b.link) === currentSurah ? 0 : 1;
    if (aLinked !== bLinked) return aLinked - bLinked;
  }
  // Default: most recent first by editedAt. "Recent" and "Edited" share the
  // same field in the mock corpus; v3 keeps both options for forward-compat.
  const aTs = Date.parse(a.editedAt) || 0;
  const bTs = Date.parse(b.editedAt) || 0;
  return bTs - aTs;
}

export function Library({ notes }: Props) {
  const { preferences, setPreference } = usePreferences();
  const view = preferences.libraryView;
  const lastReadSurah = preferences.lastRead?.surah ?? null;

  const userNotes = useUserNotes();
  // User-created notes ride on top of the static sample corpus, sorted most
  // recent first within each band — newly-saved notes feel responsive.
  const merged = useMemo<readonly Note[]>(() => {
    const userSorted = [...userNotes].sort(
      (a, b) => (Date.parse(b.editedAt) || 0) - (Date.parse(a.editedAt) || 0),
    );
    return [...userSorted, ...notes];
  }, [notes, userNotes]);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedSurahs, setSelectedSurahs] = useState<readonly number[]>([]);
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Set of surahs that appear across the merged corpus, for the dropdown.
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
    for (const note of merged) {
      for (const tag of note.tags) set.add(tag);
    }
    return Array.from(set).sort();
  }, [merged]);

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
      if (q.length > 0) {
        const haystack = [note.title, note.preview, note.tags.join(" "), note.link]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => compareForSort(a, b, sortKey, lastReadSurah));
  }, [merged, deferredQuery, selectedSurahs, selectedTags, dateRange, sortKey, lastReadSurah]);

  const isFiltering =
    deferredQuery.trim().length > 0 ||
    selectedSurahs.length > 0 ||
    selectedTags.length > 0 ||
    dateRange !== "all";

  function handleTemplateSelect(template: Template | null): void {
    const note = createNoteFromTemplate(template);
    // Use a hard navigation so the Journal page mounts fresh with the new
    // note id. router.push from inside the picker's onSelect would also
    // work, but routing through window.location avoids dragging in the
    // useRouter hook just for this single-shot redirect.
    if (typeof window !== "undefined") {
      window.location.href = `/journal?note=${encodeURIComponent(note.id)}`;
    }
  }

  // The "library is empty" state takes over the page only when we have no
  // notes at all AND the user isn't filtering. If they are filtering, we
  // fall through to the "no matches" empty state instead so it's clear the
  // filter is the reason nothing is showing.
  const showEmptyState = merged.length === 0 && !isFiltering;

  if (showEmptyState) {
    return (
      <div className="library">
        <div className="library-inner">
          <div className="library-hd">
            <h1>Notes</h1>
          </div>
          <LibraryEmpty />
        </div>
      </div>
    );
  }

  return (
    <div className="library">
      <div className="library-inner">
        <div className="library-hd">
          <h1>Notes</h1>
          <span className="count">
            {merged.length} {merged.length === 1 ? "note" : "notes"}
          </span>
        </div>

        <div className="library-bar">
          <div className="search">
            <SearchIcon size={14} />
            <input
              type="search"
              placeholder="Search notes by title, body, or verse…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search notes"
            />
          </div>

          <div className="seg" style={{ padding: 1 }} role="group" aria-label="Notes layout">
            <button
              type="button"
              className={clsx(view === "cards" && "on")}
              onClick={() => setPreference("libraryView", "cards")}
              title="Card view"
              aria-label="Card view"
              aria-pressed={view === "cards"}
            >
              <GridIcon size={13} />
            </button>
            <button
              type="button"
              className={clsx(view === "table" && "on")}
              onClick={() => setPreference("libraryView", "table")}
              title="Table view"
              aria-label="Table view"
              aria-pressed={view === "table"}
            >
              <ListIcon size={13} />
            </button>
          </div>

          <button type="button" className="btn primary" onClick={() => setPickerOpen(true)}>
            <PlusIcon size={13} /> New note
          </button>
        </div>

        <div className="lib-filters">
          <SurahFilter
            options={surahOptions}
            selected={selectedSurahs}
            onChange={setSelectedSurahs}
          />
          <DateFilter value={dateRange} onChange={setDateRange} />
          <SortControl value={sortKey} onChange={setSortKey} />
        </div>

        {tagOptions.length > 0 ? (
          <TagFilter options={tagOptions} selected={selectedTags} onChange={setSelectedTags} />
        ) : null}

        {filteredNotes.length === 0 ? (
          <div className="empty">
            <div className="ic-wrap">
              <SearchIcon size={20} />
            </div>
            <div className="ttl">No notes match your filters</div>
            <div className="sub">
              Try clearing a filter or searching by title, body, or a verse reference like{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>93:3</code>.
            </div>
          </div>
        ) : view === "cards" ? (
          <div className="note-grid">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="note-table">
            <div className="note-table-head">
              <span>Note</span>
              <span>Tags</span>
              <span>Linked to</span>
              <span style={{ textAlign: "right" }}>Edited</span>
            </div>
            {filteredNotes.map((note) => (
              <NoteRow key={note.id} note={note} />
            ))}
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
