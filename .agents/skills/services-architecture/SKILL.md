---
name: services-architecture
description: Services and repositories for the Quran Hackathon backend — context-agnostic design, service-vs-client distinction, DI through constructors, and thin async wrappers around external HTTP APIs. Provider-agnostic. Use when designing or reviewing modules under `app/services/` or `app/repositories/`.
---

# Services Architecture — Quran Hackathon

Patterns for `backend/app/services/` and `backend/app/repositories/`. Keeps logic testable and reusable from routes, CLIs, evals, and tests.

## Hard rules

- **Context-agnostic.** No `app.api.*`, `app.schemas.*`, or FastAPI primitives (`Request`, `Depends`, `HTTPException`) inside a service.
- **Constructor injection.** Services receive clients, repositories, and `Settings` via `__init__`. They do not construct their own.
- **Stateless.** No mutable per-request instance state. Read-only caches keyed on inputs are fine.
- **Pydantic at the boundaries.** Inputs and outputs are Pydantic models or primitives. No raw `dict`.
- **Explicit failure.** Raise domain exceptions (`VerseNotFound`, `EmbeddingFailed`). No silent fallbacks.

| Layer | May import | May not import |
|---|---|---|
| Services | stdlib, third-party, `app.services.*`, `app.repositories.*`, `app.models.*`, `app.core.*` | `app.api.*`, `app.schemas.*` |
| Repositories | stdlib, third-party drivers, `app.models.*`, `app.core.*` | `app.services.*`, `app.api.*`, `app.schemas.*` |

## Service vs client

| Shape | Use when | Lives in |
|---|---|---|
| **Client** | wrapping one external API; methods map ~1:1 to endpoints | `app/services/clients/` |
| **Service** | composing clients/repos, applying business rules | `app/services/` |

Anti-pattern: a "service" that forwards every method to one client — call the client directly.

## Wrapping an external HTTP API

Thin async client over the shared `httpx.AsyncClient` from app lifespan. Typed Pydantic return models. No retries inside the client — wrap with `tenacity` at the call site for read-only / idempotent ops only. Catch `httpx.HTTPError` at the client edge if callers shouldn't see transport errors.

```python
# app/services/clients/llm.py
import httpx
from pydantic import BaseModel
from app.core.config import Settings

class CompletionResult(BaseModel):
    text: str
    input_tokens: int
    output_tokens: int

class LLMClient:
    def __init__(self, settings: Settings, http: httpx.AsyncClient) -> None:
        self._http = http
        self._base_url = settings.llm_base_url
        self._key = settings.llm_api_key
        self._model = settings.llm_model

    async def complete(self, *, system: str, prompt: str, max_tokens: int = 1024) -> CompletionResult:
        r = await self._http.post(
            f"{self._base_url}/v1/complete",
            headers={"Authorization": f"Bearer {self._key}"},
            json={"model": self._model, "system": system, "prompt": prompt, "max_tokens": max_tokens},
        )
        r.raise_for_status()
        return CompletionResult.model_validate(r.json())
```

## Service template

Default to one file. Split only at ~300 lines or three+ concerns. Domain exceptions live next to the service.

```python
# app/services/verses.py
from app.models.verses import Verse
from app.repositories.quran import QuranRepository

class VerseNotFound(Exception):
    pass

class VerseService:
    def __init__(self, repo: QuranRepository) -> None:
        self._repo = repo

    async def get_verse(self, surah: int, ayah: int) -> Verse:
        verse = await self._repo.get(surah=surah, ayah=ayah)
        if verse is None:
            raise VerseNotFound(f"No verse {surah}:{ayah}")
        return verse
```

Composing a client + repo:

```python
# app/services/answer.py
class AnswerService:
    def __init__(self, repo: QuranRepository, llm: LLMClient) -> None:
        self._repo, self._llm = repo, llm

    async def answer(self, question: str, *, k: int = 5) -> CompletionResult:
        verses = await self._repo.search(question, limit=k)
        ctx = "\n".join(f"({v.surah}:{v.ayah}) {v.text_english}" for v in verses)
        return await self._llm.complete(system=f"Answer using only:\n{ctx}", prompt=question)
```

Sizing: <300 lines one file; 300–800 split into service + helpers; >800 sub-package (`app/services/rag/{retrieval,answer,citations}.py`).

## Repository pattern

Only code that touches storage. Hackathon scale = JSON, SQLite, in-memory dict, or a small vector store. Returns domain models, never rows. Writes are idempotent: deterministic key + upsert, never blind append.

```python
# app/repositories/quran.py
import json
from pathlib import Path
from app.models.verses import Verse

class QuranRepository:
    def __init__(self, corpus_path: Path) -> None:
        self._corpus_path = corpus_path
        self._by_key: dict[tuple[int, int], Verse] = {}

    def _ensure_loaded(self) -> None:
        if self._by_key:
            return
        rows = json.loads(self._corpus_path.read_text(encoding="utf-8"))
        self._by_key = {(v["surah"], v["ayah"]): Verse.model_validate(v) for v in rows}

    async def get(self, surah: int, ayah: int) -> Verse | None:
        self._ensure_loaded()
        return self._by_key.get((surah, ayah))
```

Same shape works behind `aiosqlite` or a vector store — callers don't care.

## Lazy init

Expensive deps (corpus, vector index, external clients) come from `@lru_cache(maxsize=1)` providers in `app/api/deps.py`. Same providers serve `Depends` in routes and direct calls in CLIs/tests. See `backend-coding-standards`.

## Gotchas

- Threading `Request` through services. Don't.
- Catching and swallowing exceptions. If you catch, log and `raise X from exc`.
- Recreating `httpx.AsyncClient` per call — share one from lifespan.
- Treating Pydantic models like dicts (`m["k"]`, `dict(m)`). Use attributes and `.model_dump()`.
- Mixing `app.schemas.*` into services — schemas are HTTP-only.

## Testing

Isolate services with fake repos / clients — don't spin up FastAPI. Reserve `httpx.AsyncClient + ASGITransport` for route-level integration tests.

```python
import pytest
from app.services.verses import VerseNotFound, VerseService

class FakeRepo:
    async def get(self, surah: int, ayah: int): return None

@pytest.mark.asyncio
async def test_missing_verse_raises() -> None:
    with pytest.raises(VerseNotFound):
        await VerseService(repo=FakeRepo()).get_verse(surah=1, ayah=1)
```

External-API clients are thin enough to fake with a one-class stub.
