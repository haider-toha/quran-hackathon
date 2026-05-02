"use client";

import clsx from "clsx";

import { ChevronRightIcon } from "@/components/Icon";
import type { TafsirCitation } from "@/types";

type Props = {
  citation: TafsirCitation;
  open: boolean;
  onToggle: () => void;
};

export function SourceCard({ citation, open, onToggle }: Props) {
  return (
    <div className={clsx("tp-source", open && "open")}>
      <button type="button" className="tp-source-hd" onClick={onToggle} aria-expanded={open}>
        <div>
          <div className="tp-source-name">{citation.source}</div>
          <div className="tp-source-author">{citation.author}</div>
        </div>
        <span className="chev" aria-hidden="true">
          <ChevronRightIcon size={14} />
        </span>
      </button>
      {open ? (
        <div className="tp-source-body">
          <div className="tp-source-arabic" dir="rtl" lang="ar">
            {citation.arabic}
          </div>
          <div className="tp-source-trans">{citation.english}</div>
        </div>
      ) : null}
    </div>
  );
}
