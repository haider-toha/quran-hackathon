import { Reader } from "@/components/Reader";
import { AD_DUHA, findSurah } from "@/lib/mock-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickSurahNumber(value: string | string[] | undefined): number | null {
  if (typeof value !== "string") return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  // Next.js 16: searchParams is a Promise and must be awaited before access.
  const params = await searchParams;
  const requested = pickSurahNumber(params.surah);
  // findSurah returns undefined for any surah outside the hardcoded Juz Amma
  // registry; fall back to the canonical default Surah Aḍ-Ḍuḥā.
  const surah = (requested !== null ? findSurah(requested) : undefined) ?? AD_DUHA;
  return <Reader surah={surah} />;
}
