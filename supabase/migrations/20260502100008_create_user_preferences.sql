-- Per-user content preferences. These drive the RAG and reading view:
-- which tafsirs the LLM may cite from, and which translations to render
-- side-by-side.

-- Tafsir on/off toggles. Absence of a row falls back to tafsirs.is_default_on.
create table user_tafsir_prefs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  tafsir_id  int  not null references tafsirs(id)    on delete cascade,
  enabled    boolean not null default true,
  primary key (user_id, tafsir_id)
);

-- Multi-select translations with display order.
create table user_translation_prefs (
  user_id        uuid not null references auth.users(id) on delete cascade,
  translation_id int  not null references translations(id) on delete cascade,
  position       smallint not null default 0,
  primary key (user_id, translation_id)
);
