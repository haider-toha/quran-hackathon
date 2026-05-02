"use client";

import { useEffect } from "react";

import { AlertWarnIcon } from "@/components/Icon";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="empty" role="alert" aria-live="assertive">
      <div className="ic-wrap">
        <AlertWarnIcon size={24} />
      </div>
      <div className="ttl">Something went sideways</div>
      <div className="sub">
        We hit an unexpected error rendering this view. The team has been notified — try reloading.
      </div>
      <button type="button" className="btn primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
