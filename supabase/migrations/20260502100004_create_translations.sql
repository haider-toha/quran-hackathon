-- Translations of the Quran, keyed by the API's resource_id.

create table translations (
  id            int primary key,           -- resource_id from API
  slug          text unique,               -- 'sahih-international', 'pickthall'
  name          text not null,
  author_name   text,
  language_id   smallint references languages(id) on delete set null,
  synced_at     timestamptz not null default now()
);

-- Ayah-level translation text. One row per (verse, translation).
-- footnotes are resolved via the API's /foot_note endpoint and cached here.
create table verse_translations (
  verse_id        int not null references verses(id) on delete cascade,
  translation_id  int not null references translations(id) on delete cascade,
  text            text not null,
  footnotes       jsonb,
  primary key (verse_id, translation_id)
);
