-- Bookmarks, highlights, and last-read tracking.

create table bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  verse_id    int  not null references verses(id)     on delete cascade,
  note        text,
  created_at  timestamptz not null default now(),
  unique (user_id, verse_id)
);

create table highlights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  verse_id      int  not null references verses(id)     on delete cascade,
  color         text not null default 'yellow',
  start_offset  int,                       -- char offsets within the verse text
  end_offset    int,
  created_at    timestamptz not null default now()
);

create index highlights_user_idx on highlights(user_id, verse_id);

create table reading_progress (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  last_verse_id  int  references verses(id) on delete set null,
  updated_at     timestamptz not null default now()
);
