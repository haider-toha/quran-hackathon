import type { TafsirEntry } from "@/types";

type Props = {
  sampleEntry: TafsirEntry;
  sourceName: string;
};

export function SourcePreview({ sampleEntry, sourceName }: Props) {
  const citation = sampleEntry.citations[0];
  if (!citation) return null;

  return (
    <div className="source-preview">
      <div className="head">Sample · {sampleEntry.ref}</div>
      <div className="ar" dir="rtl" lang="ar">
        {citation.arabic}
      </div>
      <div className="en">&ldquo;{citation.english}&rdquo;</div>
      <div className="src">{sourceName}</div>
    </div>
  );
}
