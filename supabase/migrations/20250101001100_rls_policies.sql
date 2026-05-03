-- Row Level Security for every user-facing table.
--
-- Policy strategy:
--   * Reference data (Quran content, tafsirs, translations, scripts):
--     public SELECT — including anon — so visitors can browse before sign-up.
--     Writes are restricted to the service role implicitly (no policy = denied
--     under RLS).
--   * User-owned data: classic `user_id = auth.uid()` pattern.
--   * Child tables that don't carry user_id: ownership inferred from parent.
--   * journal_templates: system templates readable by all, custom templates
--     readable only by their author.
--
-- Applied last so seed scripts running as service role aren't fighting
-- half-built policies.

-- ---------------------------------------------------------------------------
-- Reference data: public read.
-- ---------------------------------------------------------------------------
alter table languages           enable row level security;
alter table chapters            enable row level security;
alter table verses              enable row level security;
alter table scripts             enable row level security;
alter table verse_scripts       enable row level security;
alter table translations        enable row level security;
alter table verse_translations  enable row level security;
alter table tafsirs             enable row level security;
alter table tafsir_entries      enable row level security;
alter table tafsir_chunks       enable row level security;

create policy "public read" on languages          for select using (true);
create policy "public read" on chapters           for select using (true);
create policy "public read" on verses             for select using (true);
create policy "public read" on scripts            for select using (true);
create policy "public read" on verse_scripts      for select using (true);
create policy "public read" on translations       for select using (true);
create policy "public read" on verse_translations for select using (true);
create policy "public read" on tafsirs            for select using (true);
create policy "public read" on tafsir_entries     for select using (true);
create policy "public read" on tafsir_chunks      for select using (true);

-- ---------------------------------------------------------------------------
-- Journal templates: system-or-own.
-- ---------------------------------------------------------------------------
alter table journal_templates enable row level security;

create policy "templates: read system or own" on journal_templates
  for select using (is_system = true or created_by = auth.uid());

create policy "templates: insert own" on journal_templates
  for insert with check (created_by = auth.uid() and is_system = false);

create policy "templates: update own" on journal_templates
  for update using (created_by = auth.uid())
              with check (created_by = auth.uid());

create policy "templates: delete own" on journal_templates
  for delete using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- User-owned tables: owner has full access.
-- ---------------------------------------------------------------------------
alter table profiles                enable row level security;
alter table user_tafsir_prefs       enable row level security;
alter table user_translation_prefs  enable row level security;
alter table bookmarks               enable row level security;
alter table highlights              enable row level security;
alter table reading_progress        enable row level security;
alter table journals                enable row level security;
alter table journal_entries         enable row level security;
alter table journal_entry_sources   enable row level security;
alter table conversations           enable row level security;
alter table messages                enable row level security;

create policy "own row" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own row" on user_tafsir_prefs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on user_translation_prefs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on highlights for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on reading_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on journals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on journal_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on journal_entry_sources for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on conversations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own row" on messages for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Child tables: ownership inferred via parent.
-- ---------------------------------------------------------------------------
alter table journal_entry_verses enable row level security;
alter table message_citations    enable row level security;

create policy "via parent entry" on journal_entry_verses for all
  using (
    exists (
      select 1 from journal_entries je
      where je.id = entry_id and je.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from journal_entries je
      where je.id = entry_id and je.user_id = auth.uid()
    )
  );

create policy "via parent message" on message_citations for all
  using (
    exists (
      select 1 from messages m
      where m.id = message_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from messages m
      where m.id = message_id and m.user_id = auth.uid()
    )
  );
