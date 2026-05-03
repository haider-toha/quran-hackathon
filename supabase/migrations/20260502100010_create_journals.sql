-- Journaling layer: templates, journals, entries, verse links, and external
-- research sources.

create table journal_templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,
  name        text not null,
  description text,
  schema      jsonb not null,             -- ProseMirror/Tiptap doc skeleton
  is_system   boolean not null default false,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table journals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  template_id  uuid references journal_templates(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index journals_user_idx on journals(user_id, updated_at desc);

create trigger trg_journals_updated
  before update on journals
  for each row execute function set_updated_at();

-- Rich-text content stored as JSON (ProseMirror/Tiptap/Lexical). content_text
-- is a denormalized plain-text mirror used for FTS only.
create table journal_entries (
  id            uuid primary key default gen_random_uuid(),
  journal_id    uuid not null references journals(id)        on delete cascade,
  user_id       uuid not null references auth.users(id)      on delete cascade,
  title         text,
  content_json  jsonb not null default '{}'::jsonb,
  content_text  text,
  content_tsv   tsvector generated always as (
                  to_tsvector('english', coalesce(content_text, ''))
                ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index journal_entries_journal_idx on journal_entries(journal_id, updated_at desc);
create index journal_entries_user_idx    on journal_entries(user_id, updated_at desc);
create index journal_entries_fts         on journal_entries using gin (content_tsv);

create trigger trg_journal_entries_updated
  before update on journal_entries
  for each row execute function set_updated_at();

-- Many-to-many link between entries and verses. block_id ties the reference
-- to a specific block in the rich-text document for back-linking.
create table journal_entry_verses (
  entry_id  uuid not null references journal_entries(id) on delete cascade,
  verse_id  int  not null references verses(id)          on delete cascade,
  block_id  text not null default '',
  primary key (entry_id, verse_id, block_id)
);

create index journal_entry_verses_verse_idx on journal_entry_verses(verse_id);

-- External research sources (parallel.ai, articles, lectures, books) attached
-- to entries. Shown in the hidden side tab; AI summaries are integrated into
-- the entry body with hyperlinks back to these rows.
create table journal_entry_sources (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references journal_entries(id) on delete cascade,
  user_id       uuid not null references auth.users(id)      on delete cascade,
  kind          text not null check (
                  kind in ('article','video','podcast','book','lecture','tafsir','other')
                ),
  title         text not null,
  url           text,
  author        text,
  scholar       text,                     -- e.g. 'Omar Suleiman'
  summary       text,                     -- AI-generated, shown inline
  excerpt       text,                     -- raw quote/passage if any
  retrieved_at  timestamptz not null default now(),
  block_id      text,
  metadata      jsonb default '{}'::jsonb
);

create index journal_entry_sources_entry_idx on journal_entry_sources(entry_id);
