import Link from "next/link";

import { CompassIcon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="empty">
      <div className="ic-wrap">
        <CompassIcon size={24} />
      </div>
      <div className="ttl">We couldn&rsquo;t find that page</div>
      <div className="sub">
        The link may have moved or never existed. Head back to the reader and pick a surah from the
        top bar.
      </div>
      <Link href="/" className="btn primary">
        Open the reader
      </Link>
    </div>
  );
}
