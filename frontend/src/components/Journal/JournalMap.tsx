"use client";

// JournalMap — Phase 8. Read-only radial visualisation of a single note's
// connections. Activates as a third Journal mode alongside Compose and
// Connect. Pure SVG, deterministic radial layout, no physics, no drag.
//
// Layout, in pure geometry:
//
//   - The anchored verse sits at the canvas center as a small ringed circle.
//   - Each tafsir citation parsed from the body and each related note in
//     the store gets one node. Nodes are placed evenly around a circle of
//     radius R from center; θ_i = (2π * i) / count. This keeps the layout
//     stable across renders without a force simulation.
//   - The note's non-verse-ref tags float as text labels on a slightly
//     wider ring around the perimeter. They're decorative, not clickable.
//
// Interaction:
//
//   - Hover dimming is pure CSS — the parent `.journal-v2-map-canvas` carries
//     a `:has()` rule that fades the non-hovered children. No JS state.
//   - Click a tafsir node → returns to Compose mode (the editor) for the
//     same note. Click a related-note node → routes to that note in
//     Compose mode. Click the center circle or hit Escape → returns to
//     Compose for the current note.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { findSurahSummary } from "@/lib/mock-data";
import {
  extractTafsirCitations,
  findRelatedNotes,
  visibleTags,
  type TafsirCitation,
} from "@/lib/note-connections";
import type { Note } from "@/types";

type Props = {
  /** The note being visualised. */
  note: Note;
  /** All notes in the user's store (sample + user). Used to find related
   * notes by tag/anchor overlap. */
  allNotes: readonly Note[];
  /** Returns the user to compose mode for the current note. Wired by
   * JournalV2 to flip the persisted mode. */
  onReturnToCompose: () => void;
};

// Canvas geometry. The SVG uses an internal coordinate system anchored at
// (0, 0) — `viewBox="-W/2 -H/2 W H"` — so radial math is symmetric about
// the origin and `cx/cy = 0` lands the center node naturally. The CSS
// scales the SVG to fill its container; these numbers control proportions
// only, not pixel size.
const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 560;
const NODE_RADIUS = 200;
const TAG_RADIUS = 248;
const CENTER_NODE_R = 30;
const PERIPHERAL_NODE_R = 12;
const LABEL_OFFSET = 22;

type NodeKind = "tafsir" | "note";

type GraphNode = {
  id: string;
  kind: NodeKind;
  /** Display label inside or beside the node. */
  label: string;
  /** Optional one-line subtitle (e.g. verse ref for a tafsir node). */
  subtitle?: string;
  /** Click target: either a noteId to navigate to or null to drop into
   * compose for the current note. */
  targetNoteId: string | null;
  cx: number;
  cy: number;
};

function tafsirLabel(citation: TafsirCitation): string {
  return citation.ref ? `${citation.source} · ${citation.ref}` : citation.source;
}

// Truncate a related-note title to a comfortable label length for the map.
// 24 chars matches the spec; we cut on a word boundary when possible to
// avoid mid-word ellipsis.
function truncateTitle(title: string, max = 24): string {
  if (title.length <= max) return title;
  const slice = title.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 12 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

function buildAnchorLabel(link: string): string {
  const match = /^(\d+):(\d+)/.exec(link);
  if (!match) return link || "—";
  const num = Number(match[1]);
  const summary = findSurahSummary(num);
  const name = summary?.transliteration ?? `Surah ${num}`;
  // The full link can include a range (e.g. "93:6-8"); preserve it.
  return `${name} · ${link}`;
}

function radialCoord(index: number, total: number, radius: number): { x: number; y: number } {
  // Start at -π/2 so the first node sits straight up — visually steadier
  // than landing at 3 o'clock for a contemplative diagram.
  const theta = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(total, 1);
  return { x: Math.cos(theta) * radius, y: Math.sin(theta) * radius };
}

export function JournalMap({ note, allNotes, onReturnToCompose }: Props) {
  const router = useRouter();

  // ESC returns to compose. Listening at the document level so any focused
  // element can fire the dismiss — same pattern as JournalV2's keyboard
  // handlers. The cleanup removes the listener on unmount AND on mode
  // change (since JournalMap unmounts when the user leaves map mode).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // Don't preventDefault: other components may want Escape too. A
      // bare Escape that nothing else consumed will land here cleanly.
      onReturnToCompose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onReturnToCompose]);

  const tafsirCitations = extractTafsirCitations(note.body);
  const relatedNotes = findRelatedNotes(note, allNotes);
  const tags = visibleTags(note);

  const nodes: GraphNode[] = [];

  // Tafsir nodes first, then related-note nodes — this ordering keeps
  // tafsir clustered at the "top" of the dial (since the radial layout
  // starts at -π/2 and walks clockwise). Visually it reads as "scholarship
  // up top, conversation around it."
  const totalNodes = tafsirCitations.length + relatedNotes.length;
  let cursor = 0;
  for (const citation of tafsirCitations) {
    const { x, y } = radialCoord(cursor, totalNodes, NODE_RADIUS);
    nodes.push({
      id: `tafsir-${citation.source}`,
      kind: "tafsir",
      label: tafsirLabel(citation),
      // Tafsir nodes return the user to the editor — there's no separate
      // tafsir route in the journal scope, and dropping into compose lets
      // them keep reading the note that mentioned the source.
      targetNoteId: null,
      cx: x,
      cy: y,
    });
    cursor += 1;
  }
  for (const related of relatedNotes) {
    const { x, y } = radialCoord(cursor, totalNodes, NODE_RADIUS);
    nodes.push({
      id: `note-${related.id}`,
      kind: "note",
      label: truncateTitle(related.title),
      targetNoteId: related.id,
      cx: x,
      cy: y,
    });
    cursor += 1;
  }

  function handleNodeClick(node: GraphNode) {
    if (node.targetNoteId === null) {
      onReturnToCompose();
      return;
    }
    // Cross-note navigation: route to the other note's journal page. The
    // destination's mode store decides whether it lands in compose or
    // connect — we don't override per-note preferences. If a future user
    // opens the related note straight into map again, the persisted mode
    // does the right thing.
    router.push(`/journal?note=${encodeURIComponent(node.targetNoteId)}`);
  }

  const anchorLabel = buildAnchorLabel(note.link);

  return (
    <div className="journal-v2-map">
      {/* Top-left chrome: small note title so the user remembers what
          they're looking at. Top-right chrome: dismiss-to-compose. */}
      <div className="journal-v2-map-meta journal-v2-map-meta-title" aria-hidden={false}>
        <span className="journal-v2-map-meta-eyebrow">Map</span>
        <span className="journal-v2-map-meta-text">{note.title}</span>
      </div>
      <button
        type="button"
        className="journal-v2-map-meta journal-v2-map-meta-dismiss"
        onClick={onReturnToCompose}
        aria-label="Return to compose"
        title="Return to compose · Esc"
      >
        Return to writing
      </button>

      <svg
        className="journal-v2-map-canvas"
        viewBox={`${-CANVAS_WIDTH / 2} ${-CANVAS_HEIGHT / 2} ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Connection map for ${note.title}`}
      >
        {/* Radial connector lines, drawn first so nodes sit on top of
            them. Each line uses the node's semantic colour at low opacity
            (~30%) — the line is decoration, the node is the affordance. */}
        {nodes.map((node) => (
          <line
            key={`line-${node.id}`}
            className={`journal-v2-map-line journal-v2-map-line-${node.kind}`}
            x1={0}
            y1={0}
            x2={node.cx}
            y2={node.cy}
          />
        ))}

        {/* Center node — the anchored verse. Click drops the user back
            into compose mode. The ring uses --color-tafsir per spec. */}
        <g
          className="journal-v2-map-node journal-v2-map-node-center"
          tabIndex={0}
          role="button"
          aria-label={`Anchored verse ${anchorLabel}. Click to return to compose.`}
          onClick={onReturnToCompose}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onReturnToCompose();
            }
          }}
        >
          <circle cx={0} cy={0} r={CENTER_NODE_R} className="journal-v2-map-node-circle" />
          <text
            x={0}
            y={CENTER_NODE_R + LABEL_OFFSET}
            textAnchor="middle"
            className="journal-v2-map-label journal-v2-map-label-center"
          >
            {anchorLabel}
          </text>
        </g>

        {/* Peripheral nodes. Each is a small filled circle with a label
            placed outside the radius (toward the perimeter) so the text
            doesn't crowd the line back to center. */}
        {nodes.map((node) => {
          const labelOffsetSign = node.cy >= 0 ? 1 : -1;
          const labelY = node.cy + labelOffsetSign * (PERIPHERAL_NODE_R + LABEL_OFFSET);
          return (
            <g
              key={node.id}
              className={`journal-v2-map-node journal-v2-map-node-${node.kind}`}
              tabIndex={0}
              role="button"
              aria-label={`${node.kind === "tafsir" ? "Tafsir" : "Related note"}: ${node.label}`}
              onClick={() => handleNodeClick(node)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleNodeClick(node);
                }
              }}
            >
              <circle
                cx={node.cx}
                cy={node.cy}
                r={PERIPHERAL_NODE_R}
                className="journal-v2-map-node-circle"
              />
              <text x={node.cx} y={labelY} textAnchor="middle" className="journal-v2-map-label">
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Tag labels on the outer ring. Decorative — no nodes, no
            interaction. Placed slightly outside the node radius so the
            map reads as: anchor → connections → tags → empty space. */}
        {tags.map((tag, i) => {
          const { x, y } = radialCoord(i, Math.max(tags.length, 1), TAG_RADIUS);
          return (
            <text
              key={`tag-${tag}`}
              className="journal-v2-map-tag"
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {tag}
            </text>
          );
        })}

        {/* Empty-state hint: nothing to draw beyond the center. We keep
            it inside the SVG so the centered viewport stays the visible
            element rather than introducing a separate DOM block that
            would shift the layout if connections appear later. */}
        {nodes.length === 0 ? (
          <text
            className="journal-v2-map-empty"
            x={0}
            y={CENTER_NODE_R + LABEL_OFFSET * 3}
            textAnchor="middle"
          >
            No tafsir citations or related notes yet.
          </text>
        ) : null}
      </svg>
    </div>
  );
}
