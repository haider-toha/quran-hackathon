#!/usr/bin/env python3
"""
Seed the Quran database from the Quran Foundation API and generate
OpenAI text-embedding-3-small embeddings for all tafsir entries.

Usage:
    python scripts/seed_quran.py [--phase 1|2|all]

    Phase 1 — reference data: languages, chapters, scripts, verses,
               verse_scripts (Uthmani), translations, tafsirs, tafsir_entries
    Phase 2 — embeddings: chunk tafsir_entries and insert tafsir_chunks
    all     — run both phases in sequence (default)

Reads backend/.env automatically; individual env vars override file values.
Required env vars:
    SUPABASE_URL, SUPABASE_SECRET_KEY
    OPENAI_API_KEY  (phase 2 only)
"""

from __future__ import annotations

import os
import re
import sys
import time
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

import httpx

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent


def _load_env() -> None:
    env_file = ROOT / "backend" / ".env"
    if not env_file.exists():
        return
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


_load_env()


def _env(key: str, required: bool = True) -> str:
    val = os.environ.get(key, "")
    if required and not val:
        sys.exit(f"[error] missing env var {key}")
    return val


QURAN_BASE     = "https://api.qurancdn.com/api/qdc"
SUPABASE_URL   = _env("SUPABASE_URL").rstrip("/")
SUPABASE_KEY   = _env("SUPABASE_SECRET_KEY")
OPENAI_API_KEY = _env("OPENAI_API_KEY", required=False)

SB_HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
}

BATCH_SIZE  = 500   # PostgREST rows per upsert request
EMBED_BATCH = 100   # texts per OpenAI embeddings call
CHUNK_CHARS = 2000  # max chars per tafsir chunk

# First chapter of each juz (inclusive). Used to filter chapters when --juz is passed.
# source: standard mushaf juz boundaries.
JUZ_START_CHAPTER: dict[int, int] = {
    1: 1,   2: 2,   3: 2,   4: 3,   5: 4,
    6: 4,   7: 5,   8: 6,   9: 7,   10: 8,
    11: 9,  12: 11, 13: 12, 14: 15, 15: 17,
    16: 18, 17: 21, 18: 23, 19: 25, 20: 27,
    21: 29, 22: 33, 23: 36, 24: 39, 25: 41,
    26: 46, 27: 51, 28: 58, 29: 67, 30: 78,
}

SCRIPTS: list[dict[str, Any]] = [
    {"id": 1, "slug": "uthmani", "name": "Uthmani",  "is_glyph_code": False},
    {"id": 2, "slug": "indopak", "name": "Indo-Pak", "is_glyph_code": False},
    {"id": 3, "slug": "imlaei",  "name": "Imla'ei",  "is_glyph_code": False},
]

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

class _TagStripper(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def text(self) -> str:
        return re.sub(r"\s+", " ", "".join(self._parts)).strip()


def strip_html(html: str) -> str:
    s = _TagStripper()
    s.feed(html)
    return s.text()


def chunk_text(text: str, limit: int = CHUNK_CHARS) -> list[str]:
    if not text:
        return []
    if len(text) <= limit:
        return [text]
    chunks: list[str] = []
    while text:
        if len(text) <= limit:
            chunks.append(text)
            break
        cut = text.rfind(". ", 0, limit)
        if cut == -1:
            cut = text.rfind(" ", 0, limit)
        cut = (cut + 1) if cut != -1 else limit
        chunk = text[:cut].strip()
        if chunk:
            chunks.append(chunk)
        text = text[cut:].strip()
    return chunks


# ---------------------------------------------------------------------------
# HTTP helpers (synchronous)
# ---------------------------------------------------------------------------

def qget(client: httpx.Client, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    for attempt in range(4):
        try:
            r = client.get(f"{QURAN_BASE}/{path}", params=params, timeout=30)
            r.raise_for_status()
            return r.json()
        except (httpx.NetworkError, httpx.RemoteProtocolError) as exc:
            if attempt == 3:
                raise
            wait = 2 ** attempt
            print(f"  [retry {attempt+1}] GET {path} ({exc}), waiting {wait}s...")
            time.sleep(wait)
    raise RuntimeError("unreachable")


def sb_upsert(client: httpx.Client, table: str, rows: list[dict[str, Any]], conflict: str) -> None:
    if not rows:
        return
    url  = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={conflict}"
    hdrs = {**SB_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"}
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        r: httpx.Response | None = None
        for attempt in range(4):
            try:
                r = client.post(url, json=batch, headers=hdrs, timeout=60)
                break
            except (httpx.NetworkError, httpx.RemoteProtocolError) as exc:
                if attempt == 3:
                    raise
                wait = 2 ** attempt
                print(f"  [retry {attempt+1}] upsert {table} ({exc}), waiting {wait}s...")
                time.sleep(wait)
        if r is None or not r.is_success:
            print(f"  [error] upsert {table}: {r.status_code if r else '?'} – {r.text[:300] if r else ''}")
            if r is not None:
                r.raise_for_status()


def sb_read_all(
    client: httpx.Client,
    table: str,
    select: str,
    filters: dict[str, str] | None = None,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {"select": select, "limit": "1000"}
    if filters:
        params.update(filters)
    hdrs   = {**SB_HEADERS, "Prefer": "count=none"}
    rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        params["offset"] = str(offset)
        r = client.get(f"{SUPABASE_URL}/rest/v1/{table}", params=params, headers=hdrs, timeout=60)
        r.raise_for_status()
        page: list[dict[str, Any]] = r.json()
        rows.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    return rows


# ---------------------------------------------------------------------------
# Phase 1: reference data
# ---------------------------------------------------------------------------

def seed_languages(q: httpx.Client, sb: httpx.Client) -> None:
    print("languages...")
    d = qget(q, "resources/languages")
    rows = [
        {"id": lg["id"], "name": lg["name"], "iso_code": lg.get("iso_code"),
         "direction": lg.get("direction", "ltr")}
        for lg in d["languages"]
    ]
    sb_upsert(sb, "languages", rows, "id")
    print(f"  {len(rows)} languages")


def seed_chapters(q: httpx.Client, sb: httpx.Client) -> list[dict[str, Any]]:
    print("chapters...")
    chs = qget(q, "chapters", {"language": "en"})["chapters"]
    rows = [
        {
            "id":               ch["id"],
            "name_arabic":      ch["name_arabic"],
            "name_simple":      ch["name_simple"],
            "name_complex":     ch.get("name_complex"),
            "translated_name":  (ch.get("translated_name") or {}).get("name"),
            "revelation_place": ch["revelation_place"],
            "revelation_order": ch.get("revelation_order"),
            "bismillah_pre":    ch.get("bismillah_pre", True),
            "verses_count":     ch["verses_count"],
            "pages":            ch.get("pages"),
        }
        for ch in chs
    ]
    sb_upsert(sb, "chapters", rows, "id")
    print(f"  {len(rows)} chapters")
    return chs


def seed_scripts(sb: httpx.Client) -> None:
    print("scripts...")
    sb_upsert(sb, "scripts", SCRIPTS, "id")
    print(f"  {len(SCRIPTS)} scripts")


def seed_verses(
    q: httpx.Client, sb: httpx.Client, chapters: list[dict[str, Any]]
) -> dict[str, int]:
    print("verses...")
    verse_map: dict[str, int] = {}
    for ch in chapters:
        d = qget(q, f"verses/by_chapter/{ch['id']}", {
            "per_page": 300,
            "fields": ",".join([
                "verse_number", "juz_number", "hizb_number",
                "rub_el_hizb_number", "manzil_number", "ruku_number",
                "page_number", "sajdah_number", "v1_page", "v2_page",
            ]),
        })
        rows = []
        for v in d["verses"]:
            verse_map[v["verse_key"]] = v["id"]
            rows.append({
                "id":                 v["id"],
                "verse_key":          v["verse_key"],
                "chapter_id":         ch["id"],
                "verse_number":       v.get("verse_number"),
                "juz_number":         v.get("juz_number"),
                "hizb_number":        v.get("hizb_number"),
                "rub_el_hizb_number": v.get("rub_el_hizb_number"),
                "manzil_number":      v.get("manzil_number"),
                "ruku_number":        v.get("ruku_number"),
                "page_number":        v.get("page_number"),
                "sajdah_number":      v.get("sajdah_number"),
                "v1_page":            v.get("v1_page"),
                "v2_page":            v.get("v2_page"),
            })
        sb_upsert(sb, "verses", rows, "id")
    print(f"  {len(verse_map)} verses")
    return verse_map


def seed_verse_scripts(
    q: httpx.Client, sb: httpx.Client,
    chapters: list[dict[str, Any]], verse_map: dict[str, int],
) -> None:
    print("verse_scripts (Uthmani)...")
    for ch in chapters:
        d = qget(q, "quran/verses/by_chapter", {"chapter_number": ch["id"], "per_page": 300})
        rows = [
            {"verse_id": verse_map[v["verse_key"]], "script_id": 1, "text": v["text_uthmani"]}
            for v in d["verses"]
            if v.get("text_uthmani") and v["verse_key"] in verse_map
        ]
        sb_upsert(sb, "verse_scripts", rows, "verse_id,script_id")
    print("  done")


def seed_translations_meta(q: httpx.Client, sb: httpx.Client) -> list[dict[str, Any]]:
    print("translations metadata...")
    trans = qget(q, "resources/translations").get("translations", [])
    rows = [
        {
            "id":          t["id"],
            "slug":        t.get("slug") or None,
            "name":        t.get("name") or "",
            "author_name": t.get("author_name") or None,
            "language_id": t.get("language_id") or None,
        }
        for t in trans
    ]
    sb_upsert(sb, "translations", rows, "id")
    print(f"  {len(rows)} translations")
    return trans


def seed_verse_translations(
    q: httpx.Client, sb: httpx.Client,
    chapters: list[dict[str, Any]], verse_map: dict[str, int],
    translations: list[dict[str, Any]],
) -> None:
    print(f"verse_translations ({len(translations)} translations × {len(chapters)} chapters)...")
    ch_verse_ids: dict[int, list[int]] = {
        ch["id"]: [
            verse_map[f"{ch['id']}:{n}"]
            for n in range(1, ch["verses_count"] + 1)
            if f"{ch['id']}:{n}" in verse_map
        ]
        for ch in chapters
    }
    for idx, t in enumerate(translations, 1):
        all_rows: list[dict[str, Any]] = []
        for ch in chapters:
            d       = qget(q, f"translations/{t['id']}/by_chapter/{ch['id']}", {"per_page": 300})
            entries = d.get("translations", [])
            vids    = ch_verse_ids[ch["id"]]
            all_rows.extend(
                {"verse_id": vids[i], "translation_id": t["id"], "text": e.get("text", ""), "footnotes": None}
                for i, e in enumerate(entries)
                if i < len(vids)
            )
        sb_upsert(sb, "verse_translations", all_rows, "verse_id,translation_id")
        print(f"  [{idx}/{len(translations)}] translation {t['id']}: {len(all_rows)} rows")
    print("  done")


def seed_tafsirs_meta(q: httpx.Client, sb: httpx.Client) -> list[dict[str, Any]]:
    print("tafsirs metadata...")
    tafs = qget(q, "resources/tafsirs").get("tafsirs", [])
    rows = [
        {
            "id":            t["id"],
            "slug":          t.get("slug") or None,
            "name":          t.get("name") or "",
            "author_name":   t.get("author_name") or None,
            "language_id":   t.get("language_id") or None,
            "is_default_on": True,
            "is_indexed":    False,
        }
        for t in tafs
    ]
    sb_upsert(sb, "tafsirs", rows, "id")
    print(f"  {len(rows)} tafsirs")
    return tafs


def seed_tafsir_entries(
    q: httpx.Client, sb: httpx.Client,
    chapters: list[dict[str, Any]], verse_map: dict[str, int],
    tafsirs: list[dict[str, Any]],
) -> None:
    print(f"tafsir_entries ({len(tafsirs)} tafsirs × {len(chapters)} chapters)...")
    for idx, t in enumerate(tafsirs, 1):
        all_rows: list[dict[str, Any]] = []
        for ch in chapters:
            d       = qget(q, f"tafsirs/{t['id']}/by_chapter/{ch['id']}", {"per_page": 300})
            entries = d.get("tafsirs", [])
            for e in entries:
                verse_id = verse_map.get(e.get("verse_key", ""))
                if verse_id is None:
                    continue
                body_html = e.get("text") or ""
                body_text = strip_html(body_html)
                if not body_text:
                    continue
                all_rows.append({
                    "id":                   t["id"] * 10_000_000 + verse_id,
                    "tafsir_id":            t["id"],
                    "verse_id":             verse_id,
                    "group_verse_key_from": e.get("group_verse_key_from"),
                    "group_verse_key_to":   e.get("group_verse_key_to"),
                    "body_html":            body_html,
                    "body_text":            body_text,
                    "footnotes":            e.get("foot_notes") or None,
                })
        if all_rows:
            sb_upsert(sb, "tafsir_entries", all_rows, "id")
        print(f"  [{idx}/{len(tafsirs)}] tafsir {t['id']}: {len(all_rows)} entries")
    print("  done")


# ---------------------------------------------------------------------------
# Phase 2: embeddings
# ---------------------------------------------------------------------------

def embed_texts(client: httpx.Client, texts: list[str]) -> list[list[float]]:
    hdrs     = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    all_vecs: list[list[float]] = []
    for i in range(0, len(texts), EMBED_BATCH):
        batch = texts[i : i + EMBED_BATCH]
        r = client.post(
            "https://api.openai.com/v1/embeddings",
            json={"model": "text-embedding-3-small", "input": batch},
            headers=hdrs,
            timeout=120,
        )
        r.raise_for_status()
        items = sorted(r.json()["data"], key=lambda x: x["index"])
        all_vecs.extend(item["embedding"] for item in items)
    return all_vecs


def seed_tafsir_chunks(sb: httpx.Client, openai_client: httpx.Client) -> None:
    print("tafsir_chunks (embeddings)...")
    if not OPENAI_API_KEY:
        print("  skipped — OPENAI_API_KEY not set")
        return

    tafsir_rows = sb_read_all(sb, "tafsirs", "id,name,is_indexed")
    pending     = [t for t in tafsir_rows if not t.get("is_indexed")]
    print(f"  {len(pending)} tafsirs to embed")

    for tafsir in pending:
        tid  = tafsir["id"]
        name = tafsir["name"]
        print(f"  → {name} ({tid})")

        entries = sb_read_all(sb, "tafsir_entries", "id,verse_id,body_text",
                              filters={"tafsir_id": f"eq.{tid}"})
        if not entries:
            print("    no entries — skipping")
            continue

        chunk_meta: list[tuple[str, int, int, int]] = []
        for e in entries:
            for cidx, text in enumerate(chunk_text(e["body_text"])):
                chunk_meta.append((text, e["id"], e["verse_id"], cidx))

        if not chunk_meta:
            continue

        texts = [m[0] for m in chunk_meta]
        print(f"    {len(entries)} entries → {len(texts)} chunks, embedding...")
        vecs = embed_texts(openai_client, texts)

        rows = [
            {
                "entry_id":    chunk_meta[i][1],
                "tafsir_id":   tid,
                "verse_id":    chunk_meta[i][2],
                "chunk_index": chunk_meta[i][3],
                "content":     chunk_meta[i][0],
                "token_count": len(chunk_meta[i][0]) // 4,
                "embedding":   "[" + ",".join(str(x) for x in vecs[i]) + "]",
            }
            for i in range(len(chunk_meta))
        ]
        sb_upsert(sb, "tafsir_chunks", rows, "entry_id,chunk_index")

        sb.patch(
            f"{SUPABASE_URL}/rest/v1/tafsirs?id=eq.{tid}",
            json={"is_indexed": True},
            headers={**SB_HEADERS, "Prefer": "return=minimal"},
            timeout=30,
        ).raise_for_status()
        print(f"    {len(rows)} chunks done")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def _parse_args() -> tuple[str, int | None]:
    phase = "all"
    juz   = None
    args  = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--phase" and i + 1 < len(args):
            phase = args[i + 1]; i += 2
        elif args[i] == "--juz" and i + 1 < len(args):
            juz = int(args[i + 1]); i += 2
        else:
            i += 1
    return phase, juz


def main() -> None:
    phase, juz = _parse_args()

    with httpx.Client() as quran, httpx.Client() as supa, httpx.Client() as openai_client:
        if phase in ("1", "all"):
            print("=== Phase 1: reference data ===")
            seed_languages(quran, supa)
            all_chapters = seed_chapters(quran, supa)

            if juz is not None:
                if juz not in JUZ_START_CHAPTER:
                    sys.exit(f"[error] --juz must be 1–30, got {juz}")
                ch_from = JUZ_START_CHAPTER[juz]
                ch_to   = JUZ_START_CHAPTER.get(juz + 1, 115) - 1
                chapters = [ch for ch in all_chapters if ch_from <= ch["id"] <= ch_to]
                print(f"  filtered to juz {juz}: chapters {ch_from}–{ch_to} ({len(chapters)} chapters)")
            else:
                chapters = all_chapters

            seed_scripts(supa)
            verse_map = seed_verses(quran, supa, chapters)
            seed_verse_scripts(quran, supa, chapters, verse_map)
            translations = seed_translations_meta(quran, supa)
            seed_verse_translations(quran, supa, chapters, verse_map, translations)
            tafsirs = seed_tafsirs_meta(quran, supa)
            seed_tafsir_entries(quran, supa, chapters, verse_map, tafsirs)

        if phase in ("2", "all"):
            print("=== Phase 2: embeddings ===")
            seed_tafsir_chunks(supa, openai_client)

    print("\nDone.")


if __name__ == "__main__":
    main()
