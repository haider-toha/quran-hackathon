-- Tafsir RAG layer. Splits long tafsir entries into embedded chunks and
-- exposes a retrieval RPC that respects per-user tafsir preferences.
--
-- Embedding dimension matches text-embedding-3-small (OpenAI).
--   text-embedding-3-small = 1536
--   text-embedding-3-large = 3072
--   voyage-3               = 1024
-- If you change this, also update the function signature below.

create table tafsir_chunks (
  id            uuid primary key default gen_random_uuid(),
  entry_id      bigint not null references tafsir_entries(id) on delete cascade,
  tafsir_id     int    not null references tafsirs(id)        on delete cascade,
  verse_id      int    not null references verses(id)         on delete cascade,
  chunk_index   int    not null,
  content       text   not null,
  token_count   int,
  embedding     vector(1536),
  created_at    timestamptz not null default now(),
  unique (entry_id, chunk_index)
);

-- Pre-vector filter index: queries always know which tafsirs and verses are in
-- scope before doing similarity search.
create index tafsir_chunks_filter_idx
  on tafsir_chunks(verse_id, tafsir_id);

-- HNSW for fast approximate cosine search. Build after bulk-loading embeddings
-- for best performance — reindex with `reindex index tafsir_chunks_embedding_idx`
-- if you re-embed at scale.
create index tafsir_chunks_embedding_idx
  on tafsir_chunks using hnsw (embedding vector_cosine_ops);

-- Retrieval RPC. Takes a query embedding plus an ayah range, filters by the
-- user's enabled tafsirs (with fallback to tafsirs.is_default_on), and ranks
-- by cosine similarity.
create or replace function match_tafsir_chunks(
  query_embedding   vector(1536),
  p_user_id         uuid,
  p_chapter_id      smallint,
  p_verse_start     smallint,
  p_verse_end       smallint,
  match_count       int default 12
)
returns table (
  chunk_id      uuid,
  entry_id      bigint,
  tafsir_id     int,
  tafsir_slug   text,
  tafsir_name   text,
  verse_id      int,
  verse_key     text,
  content       text,
  similarity    real
)
language sql
stable
as $$
  with enabled as (
    select t.id
    from tafsirs t
    left join user_tafsir_prefs p
      on p.tafsir_id = t.id and p.user_id = p_user_id
    where coalesce(p.enabled, t.is_default_on) = true
      and t.is_indexed = true
  ),
  target_verses as (
    select id
    from verses
    where chapter_id = p_chapter_id
      and verse_number between p_verse_start and p_verse_end
  )
  select
    c.id,
    c.entry_id,
    c.tafsir_id,
    t.slug,
    t.name,
    c.verse_id,
    v.verse_key,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from tafsir_chunks c
  join tafsirs t on t.id = c.tafsir_id
  join verses  v on v.id = c.verse_id
  where c.tafsir_id in (select id from enabled)
    and c.verse_id  in (select id from target_verses)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
