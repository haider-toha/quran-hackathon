-- Enable required Postgres extensions.
-- Idempotent: safe to re-run.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "pg_trgm";
