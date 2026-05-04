-- AI conversation history + the citation audit trail.
--
-- Every assistant message must link back to the specific tafsir chunks (or
-- external sources) that grounded it. This is what enforces the product
-- guarantee that the LLM is purely a transferrer of information.

create table if not exists conversations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  kind              text not null check (kind in ('explain','qa','journal','research')),
  title             text,
  -- Anchors for context-aware history.
  chapter_id        smallint references chapters(id) on delete set null,
  verse_id_start    int      references verses(id)   on delete set null,
  verse_id_end      int      references verses(id)   on delete set null,
  journal_entry_id  uuid     references journal_entries(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists conversations_user_idx  on conversations(user_id, updated_at desc);
create index if not exists conversations_entry_idx on conversations(journal_entry_id);

drop trigger if exists trg_conversations_updated on conversations;
create trigger trg_conversations_updated
  before update on conversations
  for each row execute function set_updated_at();

create table if not exists messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references conversations(id) on delete cascade,
  user_id             uuid not null references auth.users(id)    on delete cascade,
  role                text not null check (role in ('user','assistant','system','tool')),
  content             text not null,
  model               text,
  prompt_tokens       int,
  completion_tokens   int,
  retrieval_strategy  text,                -- 'tafsir_rag', 'web_research', 'mixed'
  created_at          timestamptz not null default now()
);

create index if not exists messages_conversation_idx on messages(conversation_id, created_at);

-- Citations: each row links an assistant message to exactly one source —
-- a tafsir chunk, a saved journal source, or a free-form external URL.
-- The CHECK constraint enforces "exactly one of three" at the row level.
create table if not exists message_citations (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references messages(id) on delete cascade,
  tafsir_chunk_id uuid references tafsir_chunks(id)              on delete set null,
  source_id       uuid references journal_entry_sources(id)      on delete set null,
  external_url    text,
  external_title  text,
  rank            smallint,
  similarity      real,
  excerpt         text,
  check (
    (tafsir_chunk_id is not null)::int +
    (source_id       is not null)::int +
    (external_url    is not null)::int = 1
  )
);

create index if not exists message_citations_message_idx on message_citations(message_id, rank);
