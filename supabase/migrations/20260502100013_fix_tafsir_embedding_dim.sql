-- Resize tafsir embedding column from voyage-3 (1024) to
-- text-embedding-3-small (1536). Safe to run while the table is empty.

drop index if exists tafsir_chunks_embedding_idx;

alter table tafsir_chunks
  alter column embedding type vector(1536);

create index tafsir_chunks_embedding_idx
  on tafsir_chunks using hnsw (embedding vector_cosine_ops);

-- match_tafsir_chunks is defined/updated in 20260502100014_create_match_tafsir_chunks_rpc.sql
