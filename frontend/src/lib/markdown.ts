import { Fragment, createElement, type ReactNode } from "react";

// Tiny markdown renderer used by Ask deferral copy, Journal note bodies, and
// Reader tafsir summaries. The grammar is intentionally minimal: enough for
// the corpus we ship today, without pulling in `remark`/`rehype`.
//
// Inline:
//   - **bold** -> <strong>
//   - *em*     -> <em>
//   Bold is matched first so the inner `*…*` of a `**…**` pair isn't picked
//   up as italic. No escapes, no nesting beyond strong-around-em.
//
// Block:
//   - `# heading`  -> <h1>
//   - `## heading` -> <h2>
//   - `### heading`-> <h3>
//   - `> quote`    -> <blockquote>; consecutive `> ` lines join.
//                     A trailing `> — Source` line becomes <span class="src">.
//   - blank line   -> paragraph break
//   - anything else collected as a paragraph; line breaks inside a paragraph
//     join with a single space (no <br>).

const STRONG_RE = /\*\*([^*]+)\*\*/g;
const EM_RE = /\*([^*]+)\*/g;

type StrongToken = { kind: "strong"; value: string };
type RawToken = { kind: "text"; value: string };
type Token = StrongToken | RawToken;

function splitByStrong(text: string): readonly Token[] {
  const out: Token[] = [];
  let cursor = 0;
  for (const match of text.matchAll(STRONG_RE)) {
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

/**
 * Parse a single line/run of text containing only inline markdown
 * (`**bold**`, `*em*`). When `keyPrefix` is supplied, keys derive from it
 * (stable across renders for callers that pass a per-paragraph prefix).
 * Without a prefix, keys are sequential — fine for callers that already
 * wrap each result in a `<Fragment key=…>`.
 */
export function parseInline(text: string, keyPrefix?: string): ReactNode[] {
  const tokens = splitByStrong(text);
  const nodes: ReactNode[] = [];
  let seq = 0;
  const nextKey = (kind: string, ordinal: number): string =>
    keyPrefix ? `${keyPrefix}-${kind}-${ordinal}` : `md-${seq++}`;

  tokens.forEach((token, tokenIndex) => {
    if (token.kind === "strong") {
      const innerKey = keyPrefix ? `${keyPrefix}-s${tokenIndex}` : nextKey("s", tokenIndex);
      const inner = parseEmphasis(token.value, innerKey);
      nodes.push(createElement("strong", { key: innerKey }, ...inner));
      return;
    }
    // Plain segment — may still contain *em*.
    if (token.value.length === 0) return;
    const plainKey = keyPrefix ? `${keyPrefix}-p${tokenIndex}` : nextKey("p", tokenIndex);
    const inner = parseEmphasis(token.value, plainKey);
    nodes.push(createElement(Fragment, { key: plainKey }, ...inner));
  });

  return nodes;
}

function parseEmphasis(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;
  let ordinal = 0;
  for (const match of text.matchAll(EM_RE)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      out.push(text.slice(cursor, start));
    }
    out.push(createElement("em", { key: `${keyPrefix}-em-${ordinal++}` }, match[1] ?? ""));
    cursor = start + match[0].length;
  }
  if (cursor < text.length) {
    out.push(text.slice(cursor));
  }
  return out;
}

/**
 * Render a multi-line markdown body to React nodes. Splits into block
 * elements (headings, blockquotes, paragraphs) and applies inline parsing
 * to each.
 */
export function renderMarkdown(body: string): ReactNode[] {
  const lines = body.split("\n");
  const blocks: ReactNode[] = [];

  let i = 0;
  let key = 0;
  const nextKey = (): string => `md-${key++}`;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const hashes = headingMatch[1] ?? "#";
      const text = headingMatch[2] ?? "";
      const level = hashes.length;
      const tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      const id = nextKey();
      blocks.push(createElement(tag, { key: id }, ...parseInline(text, id)));
      i += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("> ")) {
        quoteLines.push((lines[i] ?? "").slice(2).trim());
        i += 1;
      }
      blocks.push(renderBlockquote(quoteLines, nextKey()));
      continue;
    }

    // Paragraph — gather lines until blank, heading, or blockquote.
    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? "";
      if (current.trim() === "" || /^#{1,3}\s/.test(current) || current.startsWith("> ")) {
        break;
      }
      paragraphLines.push(current.trim());
      i += 1;
    }
    const id = nextKey();
    blocks.push(
      createElement("p", { key: id }, ...parseInline(paragraphLines.join(" "), id)),
    );
  }

  return blocks;
}

function renderBlockquote(quoteLines: readonly string[], key: string): ReactNode {
  // If the last line begins with an em/en dash, treat it as the source caption.
  const sourceIdx = quoteLines.findIndex((l) => /^[—–-]\s/.test(l));
  const hasSource = sourceIdx !== -1 && sourceIdx === quoteLines.length - 1;

  const bodyLines = hasSource ? quoteLines.slice(0, -1) : quoteLines;
  const sourceLine = hasSource ? quoteLines[quoteLines.length - 1] : null;

  const children: ReactNode[] = [
    createElement(
      Fragment,
      { key: `${key}-body` },
      ...parseInline(bodyLines.join(" "), `${key}-body`),
    ),
  ];
  if (sourceLine) {
    children.push(
      createElement("span", { key: `${key}-src`, className: "src" }, sourceLine),
    );
  }
  return createElement("blockquote", { key }, ...children);
}
