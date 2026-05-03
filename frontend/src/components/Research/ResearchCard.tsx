import clsx from "clsx";

import {
  ArticleIcon,
  BookmarkIcon,
  ExternalIcon,
  HeadphonesIcon,
  InsertIcon,
  VideoIcon,
} from "@/components/Icon";
import type { ResearchResult, ResearchType } from "@/types";

type Props = {
  result: ResearchResult;
};

const TYPE_LABELS: Readonly<Record<ResearchType, string>> = {
  lecture: "Lecture",
  video: "Video",
  article: "Article",
};

function trustClass(trust: ResearchResult["trust"]): string {
  if (trust === "verified") return "verified";
  if (trust === "flagged") return "flagged";
  return "unknown";
}

// Type-specific icon centered in the thumb box. We commit to icon
// treatment for every result so the card grid stays visually consistent
// — mixing real video thumbnails with article placeholders looked
// unfinished at a glance.
function TypeIcon({ type }: { type: ResearchType }) {
  if (type === "lecture") return <HeadphonesIcon size={20} />;
  if (type === "video") return <VideoIcon size={20} />;
  return <ArticleIcon size={20} />;
}

function durationOrReadTime(result: ResearchResult): string | null {
  if (result.duration) return result.duration;
  if (result.readTimeMinutes !== null) return `${result.readTimeMinutes} min read`;
  return null;
}

export function ResearchCard({ result }: Props) {
  const trustModifier = trustClass(result.trust);
  const lengthLabel = durationOrReadTime(result);

  return (
    <article className={clsx("res-result", `trust-${trustModifier}`)}>
      <div className="res-thumb" aria-hidden="true">
        <TypeIcon type={result.type} />
      </div>
      <div className="res-body">
        <h3 className="res-title">{result.title}</h3>
        <div className="res-meta">
          <span className={clsx("trust-dot", trustModifier)} aria-hidden="true" />
          <span className="res-meta-speaker">{result.speaker}</span>
          <span className="res-meta-sep" aria-hidden="true">
            ·
          </span>
          <span>{TYPE_LABELS[result.type]}</span>
          {lengthLabel ? (
            <>
              <span className="res-meta-sep" aria-hidden="true">
                ·
              </span>
              <span>{lengthLabel}</span>
            </>
          ) : null}
          <span className="res-meta-sep" aria-hidden="true">
            ·
          </span>
          <span>{result.source}</span>
          {result.year ? (
            <>
              <span className="res-meta-sep" aria-hidden="true">
                ·
              </span>
              <span>{result.year}</span>
            </>
          ) : null}
          {result.trust === "flagged" ? <span className="res-flag-tag">Flagged</span> : null}
        </div>
        <p className="res-snip">{result.snippet}</p>
        <div className="res-actions">
          <button type="button" className="btn sm" aria-label={`Open ${result.title}`}>
            <ExternalIcon size={12} /> Open
          </button>
          <div className="res-actions-secondary" aria-label="Secondary actions">
            <button
              type="button"
              className="iconbtn"
              aria-label={`Insert ${result.title} into note`}
              title="Insert into note"
            >
              <InsertIcon size={13} />
            </button>
            <button
              type="button"
              className="iconbtn"
              aria-label={`Bookmark ${result.title}`}
              title="Bookmark"
            >
              <BookmarkIcon size={13} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
