import clsx from "clsx";
import Image from "next/image";

import {
  AlertInfoIcon,
  ArticleIcon,
  BookmarkIcon,
  ExternalIcon,
  HeadphonesIcon,
  InsertIcon,
  PlayIcon,
  TimeIcon,
  VideoIcon,
} from "@/components/Icon";
import type { ResearchResult, ResearchType } from "@/types";

type Props = {
  result: ResearchResult;
};

function trustClass(trust: ResearchResult["trust"]): string | undefined {
  if (trust === "verified") return undefined;
  if (trust === "flagged") return "flagged";
  return "unknown";
}

function lastMetaToken(meta: string): string {
  const tokens = meta.split("·");
  const tail = tokens[tokens.length - 1];
  return tail ? tail.trim() : meta.trim();
}

// Type-specific affordance rendered inside the .res-thumb box. Lectures show a
// large play button, videos show a thumbnail (or placeholder), articles show
// a paper-icon-with-readtime.
function ThumbAffordance({ result }: { result: ResearchResult }) {
  if (result.type === "lecture") {
    return (
      <div
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--color-ink-2)",
          color: "var(--color-bg-elev)",
          display: "grid",
          placeItems: "center",
          paddingLeft: 2,
        }}
      >
        <PlayIcon size={16} />
      </div>
    );
  }
  if (result.type === "video") {
    if (result.thumbnailUrl !== null) {
      return (
        <Image
          src={result.thumbnailUrl}
          alt=""
          width={80}
          height={60}
          unoptimized
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }
    return (
      <div
        aria-hidden="true"
        style={{
          display: "grid",
          placeItems: "center",
          width: "100%",
          height: "100%",
          background: "var(--color-bg-deep)",
          color: "var(--color-ink-4)",
        }}
      >
        <VideoIcon size={20} />
      </div>
    );
  }
  // Article fallthrough.
  return <ArticleIcon size={20} />;
}

const TYPE_LABELS: Readonly<Record<ResearchType, string>> = {
  lecture: "Lecture",
  video: "Video",
  article: "Article",
};

export function ResearchCard({ result }: Props) {
  const trustModifier = trustClass(result.trust);

  return (
    <div className="res-result">
      <div className="res-thumb">
        <ThumbAffordance result={result} />
        {result.duration ? <span className="duration">{result.duration}</span> : null}
      </div>
      <div className="res-body">
        <div className="res-row">
          <span className="speaker">
            <span className={clsx("trust-dot", trustModifier)} />
            {result.speaker}
          </span>
          <span aria-hidden="true">·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {result.type === "lecture" ? <HeadphonesIcon size={11} /> : null}
            {result.type === "video" ? <VideoIcon size={11} /> : null}
            {result.type === "article" ? <ArticleIcon size={11} /> : null}
            {TYPE_LABELS[result.type]}
          </span>
          {result.type === "article" && result.readTimeMinutes !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <TimeIcon size={11} />
                {result.readTimeMinutes} min read
              </span>
            </>
          ) : (
            <>
              <span aria-hidden="true">·</span>
              <span>{lastMetaToken(result.meta)}</span>
            </>
          )}
          {result.trust === "unknown" ? (
            <span className="chip ext" style={{ marginLeft: 4 }}>
              <AlertInfoIcon size={9} /> Unverified speaker
            </span>
          ) : null}
        </div>
        <div className="res-title">{result.title}</div>
        <div className="res-snip">{result.snippet}</div>
        <div className="res-actions">
          <button type="button" className="btn sm">
            <InsertIcon size={12} /> Insert into note
          </button>
          <button type="button" className="btn sm ghost">
            <BookmarkIcon size={12} /> Bookmark
          </button>
          <button type="button" className="btn sm ghost">
            <ExternalIcon size={12} /> Open source
          </button>
        </div>
      </div>
    </div>
  );
}
