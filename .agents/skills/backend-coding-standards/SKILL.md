---
name: backend-coding-standards
description: FastAPI coding standards for the Quran Hackathon backend — Pydantic v2 idioms, async-everywhere routing, routes/services/repositories layering, typed `Annotated[..., Depends(...)]` injection, and OpenAPI hygiene. Provider-agnostic. Use when writing or reviewing code under `backend/app/`.
---

# FastAPI Coding Standards — Quran Hackathon

For `backend/app/`. Builds on repo-root `AGENTS.md`.

## Hard rules

- **Type everything.** `mypy --strict` passes. No `Any`. Use `list[str]`, `T | None` — not `typing.List`/`Optional`.
- **Pydantic v2.** `model_config = ConfigDict(...)`, `Field(...)`, `.model_dump()`, `.model_validate()`. No `class Config`, `dict()`, `parse_obj`.
- **Async everywhere.** Routes and service methods are `async def`. One shared `httpx.AsyncClient` per process.
- **Config via `pydantic-settings`** through `app.core.config.Settings`. No hardcoded secrets.
- **No `print()`** — use `logging`. **No `HTTPException` from services** — services raise domain exceptions, routes translate. **No raw `dict` across layer boundaries**.

## Layout

```
app/
  main.py          App factory, lifespan, router includes
  core/config.py   Settings (BaseSettings)
  api/
    routes/        One file per domain (verses.py, search.py)
    deps.py        Typed Depends providers + reusable aliases
  models/          Internal Pydantic domain models
  schemas/         HTTP-facing request/response Pydantic schemas
  services/        Async business logic
  repositories/    Data access (JSON/SQLite/in-memory)
```

| Layer | Does | Doesn't |
|---|---|---|
| Routes | parse → call service → respond; map exceptions to `HTTPException` | hold business logic |
| Services | business logic, raise domain exceptions | import `app.api.*` or FastAPI |
| Repositories | get/put data, return `app.models.*` | leak rows or dicts upward |
| Schemas | HTTP-facing shapes | be passed into services |

## Dependency injection

Providers in `app/api/deps.py`, exposed as `Annotated` aliases. `@lru_cache(maxsize=1)` for build-once infra.

```python
# app/api/deps.py
from functools import lru_cache
from typing import Annotated
from fastapi import Depends
from app.core.config import Settings, settings as _settings
from app.repositories.quran import QuranRepository
from app.services.verses import VerseService

@lru_cache(maxsize=1)
def get_quran_repository() -> QuranRepository:
    return QuranRepository(corpus_path=_settings.quran_corpus_path)

def get_verse_service(
    repo: Annotated[QuranRepository, Depends(get_quran_repository)],
) -> VerseService:
    return VerseService(repo=repo)

QuranRepoDep = Annotated[QuranRepository, Depends(get_quran_repository)]
VerseServiceDep = Annotated[VerseService, Depends(get_verse_service)]
```

Override in tests via `app.dependency_overrides[get_quran_repository] = lambda: FakeRepo(...)`. Never monkey-patch.

## Route shape

```python
# app/api/routes/verses.py
from fastapi import APIRouter, HTTPException, status
from app.api.deps import VerseServiceDep
from app.schemas.verses import VerseResponse
from app.services.verses import VerseNotFound

router = APIRouter(prefix="/verses", tags=["verses"])

@router.get("/{surah}/{ayah}", response_model=VerseResponse, summary="Get a single verse",
            responses={404: {"description": "Verse not found"}})
async def get_verse(surah: int, ayah: int, service: VerseServiceDep) -> VerseResponse:
    try:
        verse = await service.get_verse(surah=surah, ayah=ayah)
    except VerseNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return VerseResponse.from_domain(verse)
```

Wire in `app/main.py`: `app.include_router(verses.router, prefix="/api/v1")`.

## Pydantic v2 patterns

```python
from typing import Annotated, Self
from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

class Verse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, frozen=True)
    surah: int = Field(gt=0, le=114, examples=[1])
    ayah: int = Field(gt=0, examples=[1])
    text_arabic: str
    text_english: str | None = None
    tags: list[str] = Field(default_factory=list)  # never `= []`

def _check_surah(v: int) -> int:
    if not 1 <= v <= 114:
        raise ValueError("surah must be 1..114")
    return v
SurahNumber = Annotated[int, AfterValidator(_check_surah)]

class VerseRange(BaseModel):
    start: tuple[SurahNumber, int]
    end: tuple[SurahNumber, int]

    @model_validator(mode="after")
    def _ordered(self) -> Self:
        if self.start > self.end:
            raise ValueError("start must be <= end")
        return self
```

`Field(examples=[...])` (plural list) — `example=` is v1. For variant payloads, use `Literal`-discriminated unions: `Result = TextResult | CitationResult`.

## OpenAPI and lifespan

Tag routers, set `summary` / `responses` / `response_model` on each path op. App-level metadata + one shared `httpx.AsyncClient` in `main.py`:

```python
# app/main.py
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import httpx
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.http = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0))
    try:
        yield
    finally:
        await app.state.http.aclose()

app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
```

Expose `app.state.http` via a `Depends` provider — services receive the client, never build one.

## Testing

`pytest` + `pytest-asyncio` (`asyncio_mode = "auto"`). Hit the API with `AsyncClient` + `ASGITransport`:

```python
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_verse() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        r = await c.get("/api/v1/verses/1/1")
    assert r.status_code == 200
```

For lifespan, wrap in `asgi-lifespan.LifespanManager`. Override DI via `app.dependency_overrides`.
