# Quran Hackathon

Quran-reading + RAG hackathon project.

## Stack

- **Backend**: FastAPI + Poetry + Python 3.13 + Pydantic v2
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4 + pnpm
- **LLM**: backend-only; Anthropic is the current default but not mandatory

## Layout

```
backend/    FastAPI service
frontend/   Next.js app
.claude/    Project skills and agent config
```

## Prerequisites

| Tool | Version | Install (macOS) |
|---|---|---|
| Python | 3.13 | `brew install python@3.13` (or `pyenv install 3.13`) |
| Node.js | 20+ | `brew install node` |
| pnpm | 9+ | `npm install -g pnpm` |
| Poetry | 2+ | `pipx install poetry` (after `brew install pipx`) |

## First-time setup

```bash
# 1. Clone
git clone https://github.com/haider-toha/quran-hackathon.git
cd quran-hackathon

# 2. Install both sides
make install

# 3. Configure env vars
cp backend/.env.example backend/.env
# Edit backend/.env if you're using a provider that needs a key (e.g. ANTHROPIC_API_KEY)

# 4. Verify the toolchain works end-to-end
make format
make lint
make type-check
make test
```

If `poetry install` complains the lockfile is stale, regenerate it with `cd backend && poetry lock && poetry install`.

## Day-to-day

```bash
make dev         # backend on :8000, frontend on :3000 (concurrently)
make format      # auto-fix formatting + lint issues on both sides
make lint        # check only — no fixes
make type-check  # mypy (backend) + tsc (frontend)
make test        # backend pytest
make clean       # remove caches and build artefacts
```

Per-side targets live in `backend/Makefile` and `frontend/package.json` — run `make help` (backend) or `pnpm run` (frontend) to list them.

## CI

GitHub Actions runs lint, format-check, type-check, and tests on every push to `main` and every pull request. See `.github/workflows/ci.yml`.

## Conventions

- `CLAUDE.md` — project guide (commands, code style, anti-patterns). Read this first.
- `.claude/skills/` — domain skills the model auto-loads:
  - `backend-coding-standards` — FastAPI / Pydantic v2 / async patterns
  - `frontend-coding-standards` — Next.js 16 / React 19 / Tailwind v4 patterns
  - `services-architecture` — service / repository / external-client layering
  - `rag-patterns` — chunking, embeddings, vector stores, citations
  - `quran-domain` — Quran data structure, Arabic handling, translations, attribution
  - `supabase-migrations` — file naming, idempotent DDL, owner-based RLS, function security
- `frontend/AGENTS.md` — Next.js 16 caveats for AI agents
