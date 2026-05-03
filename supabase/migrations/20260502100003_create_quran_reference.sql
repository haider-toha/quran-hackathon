-- Quran reference data, synced from the Quran Foundation API.
-- Primary keys mirror upstream API IDs so sync is a straight upsert.

-- Languages used by translations and tafsirs.
create table languages (
  id              smallint primary key,    -- language_id from API (38 = English, etc.)
  name            text not null,
  iso_code        text,
  direction       text not null default 'ltr' check (direction in ('ltr','rtl'))
);

-- Surahs (called "chapters" in the API; we keep that naming).
create table chapters (
  id                smallint primary key check (id between 1 and 114),
  name_arabic       text not null,
  name_simple       text not null,         -- 'Al-Fatihah'
  name_complex      text,                  -- 'Al-Fātiḥah'
  translated_name   text,                  -- 'The Opener'
  revelation_place  text not null check (revelation_place in ('makkah','madinah')),
  revelation_order  smallint,
  bismillah_pre     boolean not null default true,
  verses_count      smallint not null,
  pages             int[],                 -- [start_page, end_page]
  synced_at         timestamptz not null default now()
);

-- A verse, identified by the API's stable verse_id.
-- verse_key ('1:1') is the canonical string identifier on the front-end.
create table verses (
  id                  int primary key,     -- verse_id from API
  verse_key           text unique not null,
  chapter_id          smallint not null references chapters(id) on delete restrict,
  verse_number        smallint not null,
  juz_number          smallint,
  hizb_number         smallint,
  rub_el_hizb_number  smallint,
  manzil_number       smallint,
  ruku_number         smallint,
  page_number         smallint,
  sajdah_number       smallint,
  v1_page             smallint,
  v2_page             smallint,
  synced_at           timestamptz not null default now(),
  unique (chapter_id, verse_number)
);

create index verses_chapter_idx on verses(chapter_id, verse_number);
create index verses_juz_idx     on verses(juz_number);
create index verses_page_idx    on verses(page_number);
create index verses_hizb_idx    on verses(hizb_number);
create index verses_rub_idx     on verses(rub_el_hizb_number);
create index verses_manzil_idx  on verses(manzil_number);
create index verses_ruku_idx    on verses(ruku_number);

-- Arabic scripts: Uthmani, Indopak, Imlaei, QPC Hafs, glyph codes, etc.
-- The API exposes ~10+ scripts; users pick a preferred one in profiles.
create table scripts (
  id              smallint primary key,
  slug            text unique not null,    -- 'uthmani', 'indopak', 'qpc_hafs', ...
  name            text not null,
  is_glyph_code   boolean not null default false  -- true for code_v1/code_v2
);

-- One row per (verse, script). Backed by /quran/verses/by_script and similar.
create table verse_scripts (
  verse_id        int not null references verses(id) on delete cascade,
  script_id       smallint not null references scripts(id) on delete cascade,
  text            text not null,
  primary key (verse_id, script_id)
);
