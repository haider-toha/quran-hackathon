import { Fragment, type ReactNode } from "react";

// ── Tiny inline parser for **strong** and *em* ────────────────
// Strategy: split on `**` first (alternating strong / non-strong).
// Within non-strong segments, split on a single `*` for `<em>`.
// Pure, no DOM. Safe in RSC. Keys are derived from a caller-supplied
// prefix so they remain stable across renders.

function parseEmphasis(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split("*");
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i % 2 === 0) {
      if (part.length > 0) nodes.push(part);
    } else {
      nodes.push(<em key={`${keyPrefix}-em-${i}`}>{part}</em>);
    }
  });
  return nodes;
}

export function parseInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const strongParts = text.split("**");
  const nodes: ReactNode[] = [];
  strongParts.forEach((part, i) => {
    if (i % 2 === 0) {
      // Plain segment — may still contain *em*
      if (part.length === 0) return;
      const inner = parseEmphasis(part, `${keyPrefix}-p${i}`);
      nodes.push(<Fragment key={`${keyPrefix}-p${i}`}>{inner}</Fragment>);
    } else {
      // Strong segment — emphasis can nest inside.
      const inner = parseEmphasis(part, `${keyPrefix}-s${i}`);
      nodes.push(<strong key={`${keyPrefix}-s${i}`}>{inner}</strong>);
    }
  });
  return nodes;
}
