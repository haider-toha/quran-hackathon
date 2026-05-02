"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";

import { GridIcon, ListIcon, PlusIcon, SearchIcon } from "@/components/Icon";
import { usePreferences } from "@/lib/preferences-context";
import type { Note } from "@/types";

import { NoteCard } from "./NoteCard";
import { NoteRow } from "./NoteRow";

type FilterPill = "all" | "ad-duha" | "thematic";

type Props = {
  notes: readonly Note[];
};

const FILTER_PILLS: readonly { id: FilterPill; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ad-duha", label: "Ad-Ḍuḥā" },
  { id: "thematic", label: "Thematic" },
];

export function Library({ notes }: Props) {
  const { preferences, setPreference } = usePreferences();
  const view = preferences.libraryView;
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterPill>("all");

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((note) => {
      return (
        note.title.toLowerCase().includes(q) ||
        note.preview.toLowerCase().includes(q) ||
        note.link.toLowerCase().includes(q)
      );
    });
  }, [notes, query]);

  return (
    <div className="library">
      <div className="library-inner">
        <div className="library-hd">
          <h1>Notes</h1>
          <span className="count">{notes.length} notes</span>
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

          <div className="seg" role="tablist" aria-label="Filter notes">
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === pill.id}
                className={clsx(activeFilter === pill.id && "on")}
                onClick={() => setActiveFilter(pill.id)}
              >
                {pill.label}
              </button>
            ))}
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

          <button type="button" className="btn primary">
            <PlusIcon size={13} /> New note
          </button>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="empty">
            <div className="ic-wrap">
              <SearchIcon size={20} />
            </div>
            <div className="ttl">No notes match &ldquo;{query}&rdquo;</div>
            <div className="sub">
              Try searching by title, body, or a verse reference like{" "}
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
    </div>
  );
}
