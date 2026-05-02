import type { ReactNode } from "react";

/**
 * Tiny inline markdown parser used by the deferral panel.
 *
 * Handles only:
 *   - **bold** -> <strong>
 *   - *em*     -> <em>
 *
 * Bold is applied first (since `**foo**` would otherwise be matched as a
 * pair of `*foo*`), then `em` is applied to the remaining text segments.
 *
 * The parser is intentionally minimal: no nesting, no escapes, no other
 * markdown constructs. It exists only to render the small set of mock
 * deferral strings shipped in `SAMPLE_DEFERRAL.body`.
 */
export function parseInline(text: string): ReactNode[] {
  return splitByEm(splitByBold(text));
}

type Token =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "em"; value: string };

const BOLD_RE = /\*\*([^*]+)\*\*/g;
const EM_RE = /\*([^*]+)\*/g;

function splitByBold(text: string): Token[] {
  const out: Token[] = [];
  let cursor = 0;
  for (const match of text.matchAll(BOLD_RE)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      out.push({ kind: "text", value: text.slice(cursor, start) });
    }
    out.push({ kind: "strong", value: match[1] ?? "" });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) {
    out.push({ kind: "text", value: text.slice(cursor) });
  }
  return out;
}

function splitByEm(tokens: Token[]): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  for (const token of tokens) {
    if (token.kind === "strong") {
      out.push(<strong key={key++}>{token.value}</strong>);
      continue;
    }
    if (token.kind === "em") {
      out.push(<em key={key++}>{token.value}</em>);
      continue;
    }
    // token.kind === "text" — split further by single-asterisk em.
    const text = token.value;
    let cursor = 0;
    for (const match of text.matchAll(EM_RE)) {
      const start = match.index ?? 0;
      if (start > cursor) {
        out.push(text.slice(cursor, start));
      }
      out.push(<em key={key++}>{match[1] ?? ""}</em>);
      cursor = start + match[0].length;
    }
    if (cursor < text.length) {
      out.push(text.slice(cursor));
    }
  }
  return out;
}
