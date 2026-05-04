-- Retrieval RPC for the tafsir RAG layer. Defined here (after user_tafsir_prefs
-- exists) rather than in create_tafsir_rag, because language sql functions are
-- validated at creation time and the join to user_tafsir_prefs would fail.

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
