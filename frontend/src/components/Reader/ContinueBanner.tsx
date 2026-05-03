import Link from "next/link";

import { ArrowRightIcon, TimeIcon } from "@/components/Icon";
import { CONTINUE_READING_LABEL } from "@/lib/copy";
import { findSurahSummary } from "@/lib/mock-data";

type Props = {
  surah: number;
  ayah: number;
};

/**
 * Quiet "continue from where you left off" banner. Shown above the verses
 * when the active surah differs from the user's last-read pointer and that
 * pointer is reasonably fresh. Voice: declarative, no exclamation, no hype.
 */
export function ContinueBanner({ surah, ayah }: Props) {
  const summary = findSurahSummary(surah);
  const label = summary ? `${summary.transliteration} ${surah}:${ayah}` : `${surah}:${ayah}`;

  return (
    <Link href={`/?surah=${surah}#ayah-${ayah}`} className="continue-banner">
      <span className="cb-icon" aria-hidden="true">
        <TimeIcon size={13} />
      </span>
      <span className="cb-text">
        <span className="cb-lbl">{CONTINUE_READING_LABEL}</span>
        <span className="cb-ref">{label}</span>
      </span>
      <span className="cb-arrow" aria-hidden="true">
        <ArrowRightIcon size={13} />
      </span>
    </Link>
  );
}
