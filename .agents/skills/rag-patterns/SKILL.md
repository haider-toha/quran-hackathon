---
name: rag-patterns
description: Provider-agnostic RAG patterns for retrieval over the Quran corpus and supplementary tafsir/translations — chunking, embedding choice, vector store choice, hybrid (BM25 + dense) retrieval, reranking, citations, and multi-translation handling. Use when implementing or reviewing search/retrieval, embedding pipelines, vector store wiring, or citation logic. Trigger on "search the corpus", "embed the verses", "build the index", "rerank", "hybrid search", "citations", or "RAG".
---

# RAG Patterns — Quran Hackathon

Playbook for the retrieval layer. LLM-provider-agnostic. For backend conventions see `api-coding-standards`; for ingestion see `ingest`.

## Chunking

| Granularity | When | Tradeoff |
|---|---|---|
| **Ayah-level** (default) | Direct lookup, citation-friendly | Loses surrounding narrative context |
| Ruku-level (~10-15 ayat) | Thematic / topical questions | Coarser citations |
| Surah-level | Surah-summary questions | Way too coarse for retrieval; fallback only |
| Sliding window (N=5, stride=3) | Questions span verse boundaries | Duplicates content; needs dedup |
| Semantic split | Tafsir / commentary, **not** the Quran | Overkill; ayat have hard boundaries |

**Default: ayah-level chunks**, key `(surah, ayah)`. Every Islamic resource cites that way. Let the LLM synthesize across verses for thematic questions. Revisit only if eval traces show recall gaps.

### Arabic normalization (do once at ingest)

- Strip diacritics (`tashkeel`) for the embedding pass; keep them in stored canonical text for display.
- Normalize alef variants (`أ إ آ` → `ا`), `taa marbuta` (`ة` → `ه`), remove `tatweel` (`ـ`).
- Index both forms — display diacritized, embed undiacritized.

## Embedding Choice

Pick neutrally based on cost, locality, and whether you can hit an external API. MTEB leaderboards (multilingual retrieval) shift constantly — check before committing.

| Model | Hosting | Strengths | Weaknesses |
|---|---|---|---|
| Voyage `voyage-3-large` | API | High retrieval-MTEB; asymmetric `input_type` | Paid; vendor lock-in |
| OpenAI `text-embedding-3-large` | API | Familiar; good multilingual | Lower retrieval ceiling than top open models |
| `BAAI/bge-m3` | Local (HF) | Free; multilingual (100+ langs); dense+sparse+colbert in one | Needs GPU for batch ingest speed |
| `intfloat/multilingual-e5-large` | Local (HF) | Free; strong multilingual baseline | Asymmetric prefixes (`query:` / `passage:`) required |

**Default: `BAAI/bge-m3`** for hackathon — free, multilingual, no vendor key, and the `(dense, sparse, colbert)` triple lets you do hybrid retrieval from a single forward pass. Swap to a hosted API only if local inference is the bottleneck.

If your model has asymmetric document/query modes (Voyage `input_type`, e5 prefixes), **use them** — symmetric encoding is a measurable accuracy hit.

## Vector Store

| Store | Type | Fit for ~6,236 ayat × N translations |
|---|---|---|
| **`sqlite-vec`** | SQLite extension | Default. Single file, joins vectors + verse metadata in one query |
| LanceDB | Embedded columnar | Better at >1M rows; multimodal (text+audio); overkill here |
| Chroma | Embedded or server | Great DX; adds a process if run as server |
| Qdrant / Weaviate / Milvus | Server | Production-scale; separate process — overkill |
| In-memory FAISS / numpy | Pure Python | No persistence; fine for a notebook, not a service |

**Default: `sqlite-vec`.** The corpus fits trivially. One file holds vectors and metadata; vectors join verse text in a single query. Always go through a repository — never hit `sqlite3` from a service. Pack `list[float]` as `struct.pack(f"{len(v)}f", *v)`; query via `WHERE embedding MATCH ? AND k = ?`.

## Hybrid Retrieval (BM25 + Dense)

Pure dense misses exact-term matches: proper nouns (Musa, Maryam, Yusuf), root forms, religious vocabulary. Hybrid recovers them — confirmed by 2025 QIAS Quranic-RAG work showing accuracy gains from sparse+dense+rerank pipelines.

Run BM25 (e.g. `rank_bm25`, in-process) over translation tokens alongside the dense store. Fuse with **Reciprocal Rank Fusion** — parameter-light, no score normalization.

```python
def reciprocal_rank_fusion(
    rankings: list[list[tuple[int, int]]], *, k: int = 60, top_n: int = 20,
) -> list[tuple[int, int]]:
    scores: dict[tuple[int, int], float] = {}
    for ranking in rankings:
        for rank, ref in enumerate(ranking):
            scores[ref] = scores.get(ref, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores, key=lambda r: scores[r], reverse=True)[:top_n]
```

BM25 matters most for: named-entity queries, exact-phrase queries (e.g. "ayat al-kursi"), and cross-translation searches where a term is verbatim in one translation and paraphrased in another.

## Reranking

Pattern: retrieve top-K (20-50) cheaply, rerank to top-N (5-10), pass to LLM. Options: hosted APIs (Voyage, Cohere) or local cross-encoders (`bge-reranker-v2-m3`).

**Default: skip for hackathon.** With ayah chunks and decent embeddings, top-10 from the bi-encoder is usually fine. Add only when eval traces show relevant verses missing from top-5, or when you index a much larger corpus (full tafsir, hadith). Inject as an optional `RerankingService` so it's easy to A/B and remove.

## Citations

Every retrieval result must carry `(surah, ayah)` plus enough text to render references and feed structured citations back to the LLM.

```python
# app/models/citations.py
from pydantic import BaseModel, ConfigDict, Field

class VerseRef(BaseModel):
    """Stable, hashable reference. Use as dict key."""
    model_config = ConfigDict(frozen=True)

    surah: int = Field(gt=0, le=114)
    ayah: int = Field(gt=0)

class RetrievedVerse(BaseModel):
    ref: VerseRef
    text_arabic: str
    text_english: str | None = None
    score: float
    source: str = Field(description="e.g. 'quran-uthmani', 'sahih-international'")

class Citation(BaseModel):
    """Returned to the user alongside an answer."""
    ref: VerseRef
    quote: str = Field(description="Exact span supporting the answer")
    translation_id: str | None = None
```

**Build citations yourself, provider-agnostic:** pass top-N retrieved verses to the LLM in tagged blocks, ask for an answer plus a list of `{surah, ayah}` it relied on, validate references against the input set in post-processing. Some providers (e.g. Anthropic Citations API) offer model-verified spans; treat that as a nice-to-have, not the design.

## Multi-Translation Retrieval

- **Index Arabic and each translation separately** — one row per `(surah, ayah, translation_id)` in the vector store.
- At query time, embed the query once, search across all translation indices, **deduplicate by `(surah, ayah)`** keeping the best score.
- Return canonical Arabic + the matched translation in `RetrievedVerse`.

## Anti-Patterns

- Token-count chunking that crosses ayah boundaries.
- Concatenating multiple translations into one chunk before embedding (averages signal).
- Embedding raw Arabic without normalization — or normalizing past the diacritized canonical for display.
- Symmetric encoding when the model has document/query modes (Voyage, e5).
- Hitting the vector store from a service — always through a repository.
- Reranking before measuring — verify retrieval is the bottleneck first.
- Storing citations as free-form strings — use the typed `Citation` model.
- Building a "service" that just forwards every method to the vector store — that's a repository.
