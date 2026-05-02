import type { Surah } from "@/types";

type Props = {
  surah: Surah;
};

export function SuraBand({ surah }: Props) {
  return (
    <div className="sura-band">
      <div className="sura-no">Surah {surah.number}</div>
      <div className="sura-arabic" dir="rtl" lang="ar">
        {surah.arabic}
      </div>
      <div className="sura-name-en">
        {surah.transliteration} — {surah.meaning}
      </div>
      <div className="sura-meta">
        <span>{surah.verseCount} verses</span>
        <span>{surah.revelation}</span>
        <span>Juz {surah.juz}</span>
      </div>
    </div>
  );
}
