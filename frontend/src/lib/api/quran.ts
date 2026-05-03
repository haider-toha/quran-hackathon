// Quran data access. Today this reads from the bundled mock-data; once the
// FastAPI backend lands, the bodies become `httpx`-equivalent fetches. The
// async signatures are here from day one so call sites don't have to change.

import {
  findSurah as findSurahByNumberSync,
  JUZ_AMMA_SURAH_DATA,
  JUZ_AMMA_SURAHS,
} from "@/lib/mock-data";
import type { Surah, SurahSummary } from "@/types";

/**
 * Fetch a single surah by number. Resolves to a fully-hydrated `Surah` (with
 * verses) when the surah is in the Juzʾ ʿAmma corpus we ship today; rejects
 * with a typed error when the surah isn't found.
 */
export async function fetchSurah(n: number): Promise<Surah> {
  const surah = JUZ_AMMA_SURAH_DATA[n];
  if (!surah) {
    throw new Error(`Surah ${n} not found`);
  }
  return surah;
}

/**
 * Synchronous lookup. Returns `undefined` when the surah isn't in the bundled
 * corpus. Useful for render paths that want a surah body without awaiting.
 */
export function findSurahByNumber(n: number): Surah | undefined {
  return findSurahByNumberSync(n);
}

/**
 * List every surah summary the catalogue knows about. Resolves to summary
 * shape (no verses); fetch a single surah for the full body.
 */
export async function listSurahs(): Promise<readonly SurahSummary[]> {
  return JUZ_AMMA_SURAHS;
}
