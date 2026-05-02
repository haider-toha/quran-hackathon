import type { ReactNode } from "react";

/**
 * Tiny markdown-ish renderer for note bodies.
 *
 * Supported, in this order of precedence:
 *   - `## heading`               → <h2>
 *   - `> quote line`             → <blockquote>; consecutive `> ` lines join.
 *                                  A trailing `> — Source` line becomes
 *                                  <span class="src">.
 *   - blank line                 → paragraph break
 *   - `**bold**`                 → <strong>
 *   - `*em*`                     → <em>
 *
 * Anything else becomes a <p>. Paragraphs split on blank lines; line breaks
 * inside a paragraph are joined with a single space (no <br>).
 */

export function renderMarkdown(source: string): ReactNode[] {
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];

  let i = 0;
  let key = 0;
  const nextKey = () => `md-${key++}`;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(<h2 key={nextKey()}>{line.slice(3).trim()}</h2>);
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

    // Paragraph — gather lines until blank.
    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? "";
      if (current.trim() === "" || current.startsWith("## ") || current.startsWith("> ")) {
        break;
      }
      paragraphLines.push(current.trim());
      i += 1;
    }
    blocks.push(<p key={nextKey()}>{renderInline(paragraphLines.join(" "))}</p>);
  }

  return blocks;
}

function renderBlockquote(quoteLines: readonly string[], key: string): ReactNode {
  // If the last line begins with an em/en dash, treat it as the source caption.
  const sourceIdx = quoteLines.findIndex((l) => /^[—–-]\s/.test(l));
  const hasSource = sourceIdx !== -1 && sourceIdx === quoteLines.length - 1;

  const bodyLines = hasSource ? quoteLines.slice(0, -1) : quoteLines;
  const sourceLine = hasSource ? quoteLines[quoteLines.length - 1] : null;

  return (
    <blockquote key={key}>
      {renderInline(bodyLines.join(" "))}
      {sourceLine ? <span className="src">{sourceLine}</span> : null}
    </blockquote>
  );
}

/**
 * Inline parser. Recognises **bold** and *em*. Bold is matched before em so
 * the inner `*…*` of a `**…**` pair isn't picked up as italic.
 */
function renderInline(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  let buffer = "";
  let i = 0;
  let key = 0;
  const nextKey = () => `inline-${key++}`;

  function flushBuffer() {
    if (buffer.length > 0) {
      tokens.push(buffer);
      buffer = "";
    }
  }

  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        flushBuffer();
        tokens.push(<strong key={nextKey()}>{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }
    if (text[i] === "*") {
      const end = text.indexOf("*", i + 1);
      if (end !== -1) {
        flushBuffer();
        tokens.push(<em key={nextKey()}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }
    buffer += text[i];
    i += 1;
  }

  flushBuffer();
  return tokens;
}
