"use client";

// SurahCrumb — the small read-target crumb in the Topbar showing the
// currently active surah, derived from `?surah=` in the URL. Living in its
// own client leaf keeps `useSearchParams()` out of AppShell so the shell
// can stay a Server Component.

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { ChevronDownIcon } from "@/components/Icon";
import { DEFAULT_SURAH_NUMBER, findSurahSummary } from "@/lib/mock-data";

type Props = {
  onSurahPicker: () => void;
  surahPickerActive: boolean;
  surahPickerAnchorRef: (el: HTMLButtonElement | null) => void;
};

export function SurahCrumb({ onSurahPicker, surahPickerActive, surahPickerAnchorRef }: Props) {
  const searchParams = useSearchParams();
  const currentSurah = useMemo<number>(() => {
    const raw = searchParams?.get("surah");
    if (raw === null || raw === undefined) return DEFAULT_SURAH_NUMBER;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return DEFAULT_SURAH_NUMBER;
    return n;
  }, [searchParams]);

  const surahLabel = (() => {
    const summary = findSurahSummary(currentSurah);
    if (!summary) return `Surah ${currentSurah}`;
    return `${summary.transliteration} · ${summary.number}`;
  })();

  return (
    <div className="crumbs">
      <span>Read</span>
      <span className="sep">›</span>
      <button
        ref={surahPickerAnchorRef}
        type="button"
        className="crumb-trigger"
        onClick={onSurahPicker}
        aria-expanded={surahPickerActive}
        aria-haspopup="dialog"
      >
        <span className="current">{surahLabel}</span>
        <ChevronDownIcon size={12} />
      </button>
    </div>
  );
}
