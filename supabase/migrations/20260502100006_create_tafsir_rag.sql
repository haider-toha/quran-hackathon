-- Tafsir RAG layer. Splits long tafsir entries into embedded chunks and
-- exposes a retrieval RPC that respects per-user tafsir preferences.
--
-- Embedding dimension matches text-embedding-3-small (OpenAI).
--   text-embedding-3-small = 1536
--   text-embedding-3-large = 3072
--   voyage-3               = 1024
-- If you change this, also update the function in create_match_tafsir_chunks_rpc.

create table if not exists tafsir_chunks (
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
create index if not exists tafsir_chunks_filter_idx
  on tafsir_chunks(verse_id, tafsir_id);

-- HNSW for fast approximate cosine search. Build after bulk-loading embeddings
-- for best performance — reindex with `reindex index tafsir_chunks_embedding_idx`
-- if you re-embed at scale.
create index if not exists tafsir_chunks_embedding_idx
  on tafsir_chunks using hnsw (embedding vector_cosine_ops);

-- match_tafsir_chunks RPC is defined in a later migration (after user_tafsir_prefs exists).
