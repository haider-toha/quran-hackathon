-- User profiles (extends auth.users with app-specific fields) plus a trigger
-- that auto-creates a profile row whenever a new auth user signs up.

create table if not exists profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  display_name            text,
  avatar_url              text,
  default_translation_id  int      references translations(id) on delete set null,
  default_script_id       smallint references scripts(id)      on delete set null,
  default_reciter         text,
  locale                  text default 'en',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-provision a profile on signup. SECURITY DEFINER so it can write to
-- public.profiles when invoked from the auth schema.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
