---
name: quran-domain
description: Quran corpus reference — structure, references, Arabic/Unicode rules, translations, transliteration, tafsir, data sources, search, UX, attribution. Use when modeling Quran data, rendering Arabic, or building search/RAG.
---

# Quran Domain Reference

## Corpus structure

114 surahs; **6,236 ayat** in the Kufan tradition (the standard count for nearly all modern editions and APIs — confirm which the data source uses). Divisions: **30 juzʾ**, **60 hizb**, **240 rubʿ al-hizb**, ~558 rukuʿ. Each surah is **Meccan** or **Medinan** (chronological order is conventional, not certain). Bismillah opens every surah **except At-Tawba (#9)**; for Al-Fatiha (#1) the bismillah **is** verse 1, not a header. An-Naml (#27) has a bismillah inside verse 30.

## Verse references

`surah:ayah` (e.g. `2:255`); ranges `2:255-257`. Accept `Q.2.255`, `Q 2:255`, `2/255`, `2-255` at the parser boundary. Store internally as `(surah: int, ayah: int)`.

## Arabic text

**Two script editions:**
- **Rasm Uthmani** — traditional codex orthography (dagger alif, etc.). Default for display. KFGQPC Madinah Mushaf is the canonical modern edition.
- **Rasm Imla'i** ("simple" / dictation) — modern phonetic spelling. Default for search and tokenizing.

**Project default:** store both. Display Uthmani; index Imla'i (Tanzil "simple-clean").

**Rules:**
- Store as **NFC** (`unicodedata.normalize("NFC", text) == text` must hold at ingest).
- **Display**: keep all diacritics (tashkeel/harakat: `َ ُ ِ ْ ّ ً ٌ ٍ` plus Quranic marks U+06D6–U+06ED).
- **Search**: strip diacritics + normalize before tokenizing (otherwise shadda etc. break matches). Light Arabic stemmers (Tashaphyne) only — do not chase root extraction.
- **RTL**: wrap Arabic spans in `<span dir="rtl" lang="ar">` rather than flipping the whole UI.
- **Don't fight ligatures**: no `letter-spacing`, no `text-transform`, no `word-break: break-all` on Arabic.
- **Numerals**: Arabic-Indic `٠١٢٣٤٥٦٧٨٩` (U+0660–U+0669) for Arabic editions; Eastern Arabic-Indic `۰۱۲۳۴۵۶۷۸۹` (U+06F0–U+06F9) for Persian/Urdu mushafs. Don't mix.
- **Markers to preserve**: ayah-end `۝` (U+06DD), rubʿ al-hizb `۞` (U+06DE), sajda markers (15 in the Quran), pause markers (asbāb al-waqf).

## Fonts

- **KFGQPC Uthmanic Script HAFS** — canonical Madinah Mushaf font; uses PUA glyphs aligned to KFGQPC text data (don't mix with other text streams).
- **Amiri Quran** — open-source Naskh, standard Quranic codepoints.
- **SIL Scheherazade / Lateef** — open-source fallbacks.

Load via `next/font/local` (KFGQPC isn't on Google Fonts), `font-display: swap`, Arabic subset only.

## Translations (English)

Show "Translation by …" inline next to the text — translations are interpretive and named.

| Translator | Year | Notes |
|---|---|---|
| Sahih International | 1997 | Modern, plain English; widely used. **Project default.** |
| Pickthall | 1930 | Formal/archaic; **public domain** — safe hackathon baseline. |
| Yusuf Ali | 1934 | Poetic + extensive footnotes; older editions public domain. |
| The Clear Quran (Khattab) | 2015 | Modern, contemporary; popular in newer apps. |
| Muhammad Asad | 1980 | Modernist, philosophical; **copyrighted**. |
| Hilali-Khan | 1996 | Heavy editorial parentheticals; controversial — use cautiously. |

Hackathon default: **Sahih International + Pickthall**.

## Transliteration

Default to **ALA-LC** for verse-level content (digraphs `th, kh, sh, gh` + diacritics; readable). Use **informal** (`Al-Fatiha`, `Al-Baqarah`, no diacritics) for UI labels. Define once in `lib/transliteration.ts`.

## Tafsir

For RAG: **Ibn Kathir** (English summaries, hadith-grounded — common default) or **Tafhim al-Quran** (Maududi, modernist, accessible). Tabari is foundational but huge and hard to chunk. Qurtubi is jurisprudence-heavy. Always cite the exegete.

## Data sources

| Source | Format | License / terms |
|---|---|---|
| **Tanzil** (tanzil.net) | XML editions: Uthmani, simple-clean, simple-minimal, simple-plain | **CC-BY 3.0**: credit "Tanzil Project" + link to tanzil.net + include copyright notice. **Verbatim only — modification of the text is not permitted.** |
| **Quran.com / Quran Foundation API** (api-docs.quran.foundation) | REST: verses, translations, audio, tafsir | Free dev access via Client ID/Secret (OAuth-style). Non-exclusive, revocable license. **Commercial redistribution requires a separate written agreement.** Snippets must preserve original context. |
| **Al-Quran Cloud API** (alquran.cloud/api) | REST: ayah/surah/juz, multiple editions | Free; attribution requested. |
| **KFGQPC Madinah Mushaf** | Text aligned to KFGQPC font; multiple Qiraat (Hafs, Warsh, Qaloon, Doori) | Distributed by the King Fahd Glorious Quran Printing Complex; check redistribution terms per file. |

Project: **Tanzil** (Uthmani + simple-clean) + **Sahih International** translation + **KFGQPC Hafs** font. Maintain `ATTRIBUTION.md`.

## Search

- Index Imla'i (simple-clean), not Uthmani.
- Strip diacritics at index time; lowercase Latin co-indexed translations.
- Light stemmer (Tashaphyne / NLTK ISRI). Skip full root extraction.
- Maintain a stop list of proper nouns (`الله`, `محمد`, `عيسى`, …) that bypass stemming.
- Cross-language: search Arabic + translation indexes, dedupe by `surah:ayah`.
- **RAG**: chunk by ayah (or 2–3 ayah windows). Embed translations (most embedding models are weak in Arabic unless multilingual); always **retrieve and display the Arabic alongside**.

## UX

- Render Arabic in a Quranic font; default body fonts will look wrong.
- Show ayah numbers inside U+06DD or a styled circle: `<span class="ayah-mark">٢٥٥</span>`.
- Arabic-Indic digits in Arabic edition; Western digits in English UI chrome.
- Preserve pause and sajda markers — they're canonical text.
- Provide per-ayah recitation playback where possible.
- Persistent translation attribution near the text.

## Cultural and editorial sensitivity

- **Never edit, paraphrase, or auto-correct Quranic Arabic.** Display verbatim from a verified source.
- **Never ship LLM-generated text as Quranic text.** LLMs may summarize commentary or answer questions *about* the text; the verse itself comes from the source.
- Always cite translator and tafsir author by name.
- Render bismillah for every surah except #9; for #1 the bismillah **is** verse 1.
- Use neutral terms ("Quran" or "Qur'an"); show diacritized + transliterated surah names on first use (*Al-Baqarah / البقرة*).
- Ship an "About the text" page listing editions, translations, tafsir sources (Tanzil CC-BY requires this).

## Quick checklist

- [ ] Verse refs as `(surah, ayah)` ints; parser accepts `2:255`, `Q.2.255`, `2/255`.
- [ ] Arabic NFC at ingest.
- [ ] Two streams stored: Uthmani (display) + Imla'i (search).
- [ ] Diacritics kept for display, stripped for search.
- [ ] `dir="rtl" lang="ar"` on Arabic spans.
- [ ] Quranic font via `next/font/local`, `font-display: swap`.
- [ ] U+06DD and U+06DE rendered correctly.
- [ ] Translation attribution shown inline.
- [ ] Bismillah for every surah except #9; verse 1 of #1.
- [ ] `ATTRIBUTION.md` lists Tanzil / KFGQPC / Quran.com.
- [ ] Proper-noun stop list excluded from stemming.
