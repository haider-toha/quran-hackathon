import clsx from "clsx";

import {
  AlertInfoIcon,
  ArticleIcon,
  BookmarkIcon,
  ExternalIcon,
  HeadphonesIcon,
  InsertIcon,
  type IconProps,
  VideoIcon,
} from "@/components/Icon";
import type { ResearchResult, ResearchType } from "@/types";
import type { ComponentType } from "react";

type Props = {
  result: ResearchResult;
};

const TYPE_ICONS: Readonly<Record<ResearchType, ComponentType<IconProps>>> = {
  lecture: HeadphonesIcon,
  video: VideoIcon,
  article: ArticleIcon,
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

export function ResearchCard({ result }: Props) {
  const TypeIcon = TYPE_ICONS[result.type];
  const trustModifier = trustClass(result.trust);

  return (
    <div className="res-result">
      <div className="res-thumb">
        <TypeIcon size={20} />
        {result.duration ? <span className="duration">{result.duration}</span> : null}
      </div>
      <div className="res-body">
        <div className="res-row">
          <span className="speaker">
            <span className={clsx("trust-dot", trustModifier)} />
            {result.speaker}
          </span>
          <span aria-hidden="true">·</span>
          <span style={{ textTransform: "capitalize" }}>{result.type}</span>
          <span aria-hidden="true">·</span>
          <span>{lastMetaToken(result.meta)}</span>
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
