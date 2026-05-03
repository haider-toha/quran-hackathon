-- Tafsir corpus. Embeddings live in a separate migration so retrieval can be
-- iterated without disturbing the source-of-truth content.
--
-- The API returns tafsir text as HTML. We store both the HTML (for display)
-- and a stripped plain-text version (for FTS and embedding).

create table tafsirs (
  id              int primary key,         -- resource_id from API
  slug            text unique,
  name            text not null,
  author_name     text,
  language_id     smallint references languages(id) on delete set null,
  era             text,                    -- 'classical' | 'modern' (curated)
  description     text,
  is_default_on   boolean not null default true,   -- enabled in user prefs by default
  is_indexed      boolean not null default false,  -- has every verse been embedded?
  synced_at       timestamptz not null default now()
);

-- One row per (tafsir, verse). Matches the API shape exactly.
create table tafsir_entries (
  id                    bigint primary key,   -- API entry id (e.g. 82641)
  tafsir_id             int not null references tafsirs(id) on delete cascade,
  verse_id              int not null references verses(id) on delete cascade,
  -- When a tafsir comments on a passage, the same body is returned for each
  -- verse in the group. These columns let the UI dedupe by passage.
  group_verse_key_from  text,
  group_verse_key_to    text,
  body_html             text not null,
  body_text             text not null,
  body_tsv              tsvector generated always as (
                          to_tsvector('english', body_text)
                        ) stored,
  footnotes             jsonb,
  synced_at             timestamptz not null default now(),
  unique (tafsir_id, verse_id)
);

create index tafsir_entries_tafsir_verse_idx on tafsir_entries(tafsir_id, verse_id);
create index tafsir_entries_verse_idx        on tafsir_entries(verse_id);
create index tafsir_entries_fts              on tafsir_entries using gin (body_tsv);
