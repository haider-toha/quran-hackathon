---
name: supabase-migrations
description: Supabase + Postgres migration standards for the Quran Hackathon — file naming with real timestamps, idempotent DDL, owner-based RLS for B2C user-scoped data, function security (INVOKER vs DEFINER), the shared `update_updated_at_column` trigger, and views/materialized-view safety. Use when adding schema, RLS policies, RPCs, triggers, or any SQL under `supabase/migrations/`.
---

# Supabase Migrations — Quran Hackathon

For SQL under `supabase/migrations/`. B2C app: user-owned rows scoped by `user_id` (FK to `auth.users.id`); RLS enforces "users see and mutate only their own rows". The Quran corpus and other public read-only data is exposed openly.

## Hard rules

- **One migration file per logical change.** Generated via `supabase migration new <name>`. Never edit a migration once it has been pushed/merged — write a new one.
- **Every statement is idempotent.** `IF [NOT] EXISTS` guards or `CREATE OR REPLACE` on every `CREATE`/`DROP`/`ALTER`. Re-running the file must never error.
- **UUID primary keys** with `DEFAULT gen_random_uuid()`. Inline foreign keys with explicit `ON DELETE`.
- **RLS is enabled on every public table.** Supabase exposes `public` through PostgREST under the anon key — unscoped tables are world-readable.
- **Functions default to `SECURITY INVOKER`.** Use `DEFINER` only when there is no other way; if you do, set `search_path = ''`, schema-qualify everything, and revoke from `anon`/`authenticated`.

## File naming

Pattern: `YYYYMMDDHHmmss_<snake_case_description>.sql` — timestamp down to the second, lowercase, verb-led description.

```bash
supabase migration new add_verse_notes      # generates 20260501142317_add_verse_notes.sql
date +"%Y%m%d%H%M%S"                        # if you must build the name by hand
```

Reject filenames whose timestamp ends in `000000`, `120000`, `180000`, etc. — those are hand-rolled, collide on parallel branches, and break ordering.

## Idempotency cheat sheet

Every object type has a re-runnable form. Use it.

| Object | Pattern |
|---|---|
| Table | `CREATE TABLE IF NOT EXISTS public.t (...);` / `DROP TABLE IF EXISTS public.t;` |
| Column | `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='t' AND column_name='c') THEN ALTER TABLE public.t ADD COLUMN c text; END IF; END $$;` |
| Index | `CREATE INDEX IF NOT EXISTS idx_t_c ON public.t (c);` |
| Type / ENUM | `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='my_enum') THEN CREATE TYPE public.my_enum AS ENUM ('A','B'); END IF; END $$;` then `ALTER TYPE public.my_enum ADD VALUE IF NOT EXISTS 'C';` |
| Function | `CREATE OR REPLACE FUNCTION ...` (inherently idempotent) |
| Trigger | `DROP TRIGGER IF EXISTS trg_x ON public.t; CREATE TRIGGER trg_x ...;` |
| Policy | `DROP POLICY IF EXISTS p_t_select ON public.t; CREATE POLICY p_t_select ...;` |
| Grants | `GRANT`/`REVOKE` are inherently idempotent |

## Schema basics

- **PK**: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- **FKs**: inline, with explicit `ON DELETE`. `CASCADE` for owned children, `SET NULL` for soft refs (column must be nullable), `RESTRICT` for loud failures.
- **ENUMs**: ALL-CAPS values, qualified type name (`public.note_status`), closed sets only.
- **Timestamps**: `created_at` and `updated_at` as `timestamptz NOT NULL DEFAULT now()` plus the trigger below.

## The shared `updated_at` trigger

Define `public.update_updated_at_column()` once (in the first migration that needs it) and reuse it for every table. Do not invent per-table variants.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verse_notes_set_updated_at ON public.verse_notes;
CREATE TRIGGER trg_verse_notes_set_updated_at
BEFORE UPDATE ON public.verse_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## Row-Level Security

Enable RLS on every table in `public`, then write the policy you actually need. For Quran Hackathon the common shape is owner-based: a user can see and mutate only their own rows.

```sql
ALTER TABLE public.verse_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verse_notes_select_own ON public.verse_notes;
CREATE POLICY verse_notes_select_own
ON public.verse_notes
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS verse_notes_modify_own ON public.verse_notes;
CREATE POLICY verse_notes_modify_own
ON public.verse_notes
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
```

- Always scope `TO authenticated` (or a specific role). Omitting it opens the policy to `anon` too.
- Wrap `auth.uid()`/`auth.jwt()` in a subquery so Postgres evaluates them once per statement, not per row.
- Index every column referenced in `USING`/`WITH CHECK` (e.g. `idx_verse_notes_user_id`).
- Public read-only data (the Quran corpus) can use `FOR SELECT TO anon, authenticated USING (true)`.
- Test policies via the client SDK — the SQL editor runs as `postgres` and bypasses RLS.

## Function security

| | `SECURITY INVOKER` (default) | `SECURITY DEFINER` (rare) |
|---|---|---|
| Runs as | calling user | function owner |
| RLS applies? | yes | no — bypassed |
| When to use | the answer 99% of the time | accessing `vault.*`, system triggers, or cross-user reads that must bypass RLS |
| Required if used | nothing extra | `SET search_path = ''`, schema-qualify every reference, `REVOKE` from `PUBLIC`/`anon`/`authenticated`, `GRANT EXECUTE` only to the role that needs it |

```sql
-- DEFINER template — only when truly necessary
CREATE OR REPLACE FUNCTION public.privileged_op(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.some_table SET state = 'done' WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.privileged_op(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.privileged_op(uuid) TO service_role;
COMMENT ON FUNCTION public.privileged_op(uuid) IS 'SECURITY DEFINER — service_role only.';
```

## Views

Always set `security_invoker = on` so RLS on the underlying tables is enforced for the calling user:

```sql
CREATE OR REPLACE VIEW public.v_my_view WITH (security_invoker = on) AS
SELECT ... FROM public.t;
```

## Materialized views

Materialized views **cannot have RLS** and snapshot all rows at refresh time. If you need one: create the MV (`mv_*`), `REVOKE SELECT ... FROM PUBLIC, anon, authenticated` and `GRANT SELECT ... TO service_role`, then expose a `security_invoker = on` view (`v_*`) that filters per-user. Grant `SELECT` only on the filtered view; RPCs and frontend code query `v_*`, never the raw MV.

## Declarative schema (optional)

Supabase offers a declarative mode (`supabase/schemas/*.sql` + `supabase db diff -f <name>`) that generates migrations from a desired state. Still experimental in 2026 with gaps around RLS and views — write migrations by hand for this project.

## Migration template

```sql
-- 20260501142317_add_verse_notes.sql
CREATE TABLE IF NOT EXISTS public.verse_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah int NOT NULL CHECK (surah BETWEEN 1 AND 114),
  ayah int NOT NULL CHECK (ayah > 0),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verse_notes_user_id ON public.verse_notes (user_id);

ALTER TABLE public.verse_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verse_notes_select_own ON public.verse_notes;
CREATE POLICY verse_notes_select_own ON public.verse_notes
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS verse_notes_modify_own ON public.verse_notes;
CREATE POLICY verse_notes_modify_own ON public.verse_notes
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS trg_verse_notes_set_updated_at ON public.verse_notes;
CREATE TRIGGER trg_verse_notes_set_updated_at
BEFORE UPDATE ON public.verse_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.verse_notes IS 'Per-user notes on individual verses.';
```

## Testing

If you reach for SQL-level tests (RLS regressions, RPC behaviour), pgTAP is the framework Supabase ships — `supabase test db` runs files under `supabase/tests/`. Most app behaviour is better covered by Python tests against the API.

## Review checklist

- [ ] Filename `YYYYMMDDHHmmss_<snake_case>.sql`; timestamp not rounded.
- [ ] One logical change per file; no edits to previously-pushed migrations.
- [ ] Every `CREATE`/`DROP`/`ALTER` is idempotent (`IF [NOT] EXISTS`, `CREATE OR REPLACE`, drop-before-create for triggers/policies).
- [ ] UUID PK with `gen_random_uuid()`; FKs inline with explicit `ON DELETE`.
- [ ] `created_at` / `updated_at` columns + the shared `update_updated_at_column` trigger (no per-table variants).
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on every new table in `public`.
- [ ] RLS policies scoped `TO authenticated` (or a specific role), `auth.uid()` wrapped in `(SELECT ...)`, columns referenced in `USING`/`WITH CHECK` are indexed.
- [ ] Views use `WITH (security_invoker = on)`.
- [ ] Materialized views have `SELECT` revoked from `anon`/`authenticated` and are exposed via a filtered `security_invoker` view.
- [ ] Functions are `SECURITY INVOKER` unless justified; any `SECURITY DEFINER` sets `search_path = ''`, schema-qualifies all references, and revokes from `PUBLIC`/`anon`/`authenticated`.
- [ ] CHECK constraints validated against existing data (or added `NOT VALID` then `VALIDATE CONSTRAINT`).
- [ ] No secrets, hardcoded UUIDs, or debug `RAISE NOTICE` left behind.
- [ ] `COMMENT ON` documents non-obvious tables, columns, and any `SECURITY DEFINER` function.
- [ ] Local `supabase db reset` succeeds before pushing.
