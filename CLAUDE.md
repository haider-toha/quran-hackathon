# Quran Hackathon — Project Guide

## Repo structure

```
backend/   FastAPI + Poetry (Python 3.13)
frontend/  Next.js 16 App Router + TypeScript + Tailwind
```

## Commands

| Action | Backend | Frontend |
|---|---|---|
| Install | `make install` (in `backend/`) | `pnpm install` (in `frontend/`) |
| Dev server | `make dev` | `pnpm dev` |
| Format | `make format` | `pnpm format` |
| Lint | `make lint` | `pnpm lint` |
| Type check | `make type-check` | `pnpm type-check` |
| Test | `make test` | — |

Root-level `make <command>` runs both sides. See `Makefile` and `backend/Makefile` for the full list.

Project conventions live in `.claude/skills/` — `backend-coding-standards`, `frontend-coding-standards`, `services-architecture`, `quran-domain`, `rag-patterns`. Read those before writing code in the matching area.

---

## Backend — Python / FastAPI

### Core rules

- **Type everything.** Every function parameter and return type must have annotations. `mypy --strict` must pass.
- **Use Pydantic v2 for all data shapes.** Request bodies, response models, config, domain objects — all Pydantic `BaseModel`. Never pass raw `dict` across layer boundaries.
- **Pydantic settings** via `pydantic-settings` `BaseSettings`. All config comes from env vars; never hardcode secrets.
- **Async everywhere.** Route handlers and service functions must be `async def`. Use `httpx.AsyncClient` for outbound HTTP.
- **One responsibility per module.** Routes only handle HTTP concerns (parse request, call service, return response). Business logic lives in service modules. Data access lives in repository modules.
- **Raise `HTTPException` at the router layer**, not inside services. Services raise domain exceptions; routes translate them.

### Pydantic patterns

```python
# Always use model_config, not class Config
class UserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str
    email: EmailStr

# Use Field for validation and documentation
class Verse(BaseModel):
    number: int = Field(gt=0, description="Verse number within the surah")
    text_arabic: str
    text_english: str | None = None

# Prefer explicit Optional syntax: T | None, not Optional[T]
```

### Directory layout

```
app/
  main.py          FastAPI app factory + middleware
  core/
    config.py      Settings (BaseSettings)
  api/
    routes/        One file per domain (e.g. quran.py, notes.py)
  models/          Pydantic domain models (internal, not HTTP-facing)
  schemas/         Pydantic request/response schemas (HTTP-facing)
  services/        Business logic
  repositories/    Data access
tests/
  test_*.py        pytest; use httpx.AsyncClient + ASGITransport
```

### Anti-patterns to avoid

- Do not use `Any` — be explicit.
- Do not use mutable default arguments. Use `Field(default_factory=list)`.
- Do not import from `typing` when the built-in works: use `list[str]`, `dict[str, int]`, `str | None`.
- Do not call `dict()` on a Pydantic model — use `.model_dump()`.
- Do not use `print()` — use Python's `logging` module.

---

## Frontend — Next.js / TypeScript

### Core rules

- **App Router only.** No Pages Router. All routes live under `src/app/`.
- **Prefer Server Components.** Default to RSC; add `"use client"` only when you need interactivity (`useState`, `useEffect`, event handlers) or browser-only APIs.
- **Strict TypeScript.** `tsconfig.json` has `strict: true`. Never use `any` — prefer `unknown` + type narrowing. Never use `@ts-ignore`.
- **Fetch in Server Components.** Data fetching belongs in RSCs or Server Actions, not client-side `useEffect`.
- **Colocate files.** Keep a component's styles, tests, and helpers next to the component file.

### TypeScript patterns

```typescript
// Use `type` for shapes, `interface` for extension points
type Verse = {
  number: number;
  textArabic: string;
  textEnglish?: string;
};

// Prefer discriminated unions over boolean flags
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// Type API responses explicitly — never trust `unknown` without narrowing
async function fetchVerse(id: number): Promise<Verse> {
  const res = await fetch(`/api/v1/verses/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Verse>;
}
```

### Directory layout

```
src/
  app/             Routes (page.tsx, layout.tsx, loading.tsx, error.tsx)
  components/      Shared UI — one folder per component
    Button/
      Button.tsx
      index.ts
  lib/             Pure utilities and API clients (no React)
  types/           Shared TypeScript types
  hooks/           Client-side custom hooks (use client)
```

### Anti-patterns to avoid

- Do not fetch data in `useEffect` — use RSCs or Server Actions.
- Do not use `<img>` — use `<Image>` from `next/image`.
- Do not use `<a>` for internal links — use `<Link>` from `next/link`.
- Do not use `React.FC` — just type props explicitly.
- Do not spread unknown objects as props.
- Do not put secrets in the frontend — only `NEXT_PUBLIC_` vars are safe to expose.

---

## LLM integration

The current default provider is Anthropic, but the project is not locked to it — the patterns below apply to any provider.

- LLM calls live in the backend. Never call an LLM provider directly from the frontend.
- Provider credentials come from env vars loaded via `pydantic-settings`. Today that means `ANTHROPIC_API_KEY`; swap in equivalents (`OPENAI_API_KEY`, etc.) if the provider changes.
- When using Anthropic, the current default models are `claude-sonnet-4-6` for generation and `claude-haiku-4-5-20251001` for classification/routing. Treat these as defaults, not mandates.
- If the provider supports prompt caching, enable it on large static context (Quran corpus, long system prompts). With Anthropic that's `cache_control` blocks.
