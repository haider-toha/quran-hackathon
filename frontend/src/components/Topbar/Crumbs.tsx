import { Fragment } from "react";

const CRUMBS_BY_PATH: Record<string, readonly string[]> = {
  "/": ["Read", "Ad-Duha · 93"],
  "/ask": ["Ask", "Scoped to Ad-Duha 93:1–11"],
  "/journal": ["Journal", "On grief that comes in waves"],
  "/library": ["Library"],
  "/research": ["Research", "External — Ad-Duha 93:3"],
  "/settings": ["Settings", "Tafsir sources"],
};

export function Crumbs({ pathname }: { pathname: string }) {
  const items = CRUMBS_BY_PATH[pathname] ?? ["Read"];
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      {items.map((label, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={label}>
            {i > 0 && (
              <span className="sep" aria-hidden>
                ›
              </span>
            )}
            <span
              className={isLast ? "current" : undefined}
              aria-current={isLast ? "page" : undefined}
            >
              {label}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}
