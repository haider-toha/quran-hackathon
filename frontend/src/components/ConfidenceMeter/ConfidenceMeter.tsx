import clsx from "clsx";

import type { ConfidenceLevel } from "@/types";

type Props = {
  level: ConfidenceLevel;
  sources: number;
  total: number;
};

const RADIUS = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LEVEL_LABEL: Record<ConfidenceLevel, string> = {
  high: "High agreement",
  med: "Mixed",
  low: "Limited",
};

const LEVEL_STROKE_VAR: Record<ConfidenceLevel, string> = {
  high: "var(--color-tafsir)",
  med: "var(--color-ink-3)",
  low: "var(--color-ext)",
};

export function ConfidenceMeter({ level, sources, total }: Props) {
  const ratio = total === 0 ? 0 : Math.max(0, Math.min(1, sources / total));
  const dashOffset = CIRCUMFERENCE - ratio * CIRCUMFERENCE;
  const stroke = LEVEL_STROKE_VAR[level];
  const label = LEVEL_LABEL[level];

  return (
    <div
      className={clsx("confidence", level)}
      title={`${sources} of ${total} sources, ${level} agreement`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r={RADIUS} stroke="var(--color-line)" strokeWidth="2" fill="none" />
        <circle
          cx="10"
          cy="10"
          r={RADIUS}
          stroke={stroke}
          strokeWidth="2"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 10 10)"
        />
      </svg>
      <span className="label">{label}</span>
      <span className="meta">
        {sources}/{total}
      </span>
    </div>
  );
}
