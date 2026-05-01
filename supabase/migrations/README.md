# Supabase Migrations

SQL migration files for the Quran Hackathon Postgres schema. Files run in filename (timestamp) order.

## Quick reference

```bash
# 1. Create a new migration (generates YYYYMMDDHHmmss_<name>.sql in this folder)
supabase migration new add_verse_notes

# 2. Apply locally — recreates the local DB and runs every migration
supabase db reset

# 3. Diff your manual local edits against the migrations folder, save as a new file
supabase db diff -f <name>

# 4. Push to a linked remote project
supabase db push
supabase db push --dry-run    # preview only
```

If you do not yet have a local stack, `supabase init` then `supabase start` from the repo root.

## File naming

`YYYYMMDDHHmmss_<snake_case_description>.sql` — real timestamp down to the second, lowercase, verb-led description (`add_`, `create_`, `update_`, `fix_`, `remove_`).

```
20260501142317_add_verse_notes.sql       OK — real timestamp
20260501180000_add_verse_notes.sql       NOT OK — rounded, hand-rolled
add_verse_notes.sql                      NOT OK — missing timestamp
```

Always generate via `supabase migration new` or `date +"%Y%m%d%H%M%S"`. Never hand-pick the timestamp.

## Rules

The full standards (idempotency, RLS, function security, the shared `update_updated_at_column` trigger, view/materialized-view safety, review checklist) live in the skill at:

`.claude/skills/supabase-migrations/SKILL.md`

Read that before opening a PR that adds or changes a migration.

## Editing existing migrations

Once a migration has been merged or pushed to any environment, treat it as immutable — write a new migration to change the schema further. Edit-in-place is fine only while the file is unmerged on your local branch.
