"use client";

// FloatingCard — a viewport-aware, portal-rendered floating panel.
//
// This is the shared positioning primitive behind tooltips and small dialogs
// (slash menu, citation hover card, popovers). Anchors itself to a passed
// HTMLElement, reads the rect on open + on resize/scroll, and flips to the
// opposite side or edge when the requested placement would overflow.
//
// Two roles are supported:
//   - "tooltip" — passive overlay, no focus trap, no Escape/outside-click close
//   - "dialog"  — modal-ish, traps focus, Escape and outside click both close
//
// Consumers control visibility via `open`. When `open === false`, this
// component renders nothing (no portal node attached, no listeners). When
// `open === true` but the runtime is SSR, also renders nothing — the portal
// is only mounted client-side.

import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useDialogFocus } from "@/hooks/useDialogFocus";

export type Placement = "top" | "bottom" | "left" | "right" | "auto";

export type FloatingCardProps = {
  /**
   * Anchor element. Position is computed from its `getBoundingClientRect()`.
   * If `null`, the card renders nothing.
   */
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Default `"auto"` — prefers top, falls back to bottom. */
  placement?: Placement;
  className?: string;
  children: ReactNode;
  /** Default `"dialog"`. Tooltips skip focus trap and outside-click/Escape close. */
  role?: "dialog" | "tooltip";
};

// Pixel padding kept between the card and the viewport edges before flipping.
const VIEWPORT_PAD = 8;
// Gap between the anchor and the card edge.
const ANCHOR_GAP = 6;

type ResolvedPosition = {
  top: number;
  left: number;
};

// Use layout effect on the client, no-op on the server. Avoids SSR warnings.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function isClient(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Returns `true` once the component has hydrated on the client. Implemented
 * with `useSyncExternalStore` so React knows the value differs between
 * server (returns `false`) and client (returns `true`) without us calling
 * setState in an effect — which the compiler/lint rule rightly dislikes.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Pick a side that fits the viewport. Tries `requested` first, then the
 * opposite. Falls back to clamping to the viewport when neither side fits.
 */
function resolvePlacement(
  requested: Exclude<Placement, "auto"> | "auto",
  anchorRect: DOMRect,
  cardSize: { width: number; height: number },
  viewport: { width: number; height: number },
): { side: "top" | "bottom" | "left" | "right"; position: ResolvedPosition } {
  const candidate: ("top" | "bottom" | "left" | "right")[] =
    requested === "auto"
      ? ["top", "bottom", "left", "right"]
      : requested === "top"
        ? ["top", "bottom"]
        : requested === "bottom"
          ? ["bottom", "top"]
          : requested === "left"
            ? ["left", "right"]
            : ["right", "left"];

  for (const side of candidate) {
    if (fits(side, anchorRect, cardSize, viewport)) {
      return { side, position: place(side, anchorRect, cardSize, viewport) };
    }
  }
  // Nothing fit — pick the original preference and let clamping rescue it.
  const fallback = candidate[0] ?? "bottom";
  return { side: fallback, position: place(fallback, anchorRect, cardSize, viewport) };
}

function fits(
  side: "top" | "bottom" | "left" | "right",
  anchor: DOMRect,
  card: { width: number; height: number },
  vp: { width: number; height: number },
): boolean {
  if (side === "top") return anchor.top - ANCHOR_GAP - card.height >= VIEWPORT_PAD;
  if (side === "bottom")
    return anchor.bottom + ANCHOR_GAP + card.height <= vp.height - VIEWPORT_PAD;
  if (side === "left") return anchor.left - ANCHOR_GAP - card.width >= VIEWPORT_PAD;
  return anchor.right + ANCHOR_GAP + card.width <= vp.width - VIEWPORT_PAD;
}

/**
 * Compute final top/left for a given side, then clamp/edge-flip horizontally
 * (for top/bottom) or vertically (for left/right).
 */
function place(
  side: "top" | "bottom" | "left" | "right",
  anchor: DOMRect,
  card: { width: number; height: number },
  vp: { width: number; height: number },
): ResolvedPosition {
  let top = 0;
  let left = 0;

  if (side === "top") {
    top = anchor.top - ANCHOR_GAP - card.height;
    left = anchor.left;
  } else if (side === "bottom") {
    top = anchor.bottom + ANCHOR_GAP;
    left = anchor.left;
  } else if (side === "left") {
    top = anchor.top;
    left = anchor.left - ANCHOR_GAP - card.width;
  } else {
    top = anchor.top;
    left = anchor.right + ANCHOR_GAP;
  }

  if (side === "top" || side === "bottom") {
    // Edge-flip horizontally: if the card would overflow the right viewport
    // edge, anchor it to the right of the anchor instead of the left.
    if (left + card.width > vp.width - VIEWPORT_PAD) {
      left = anchor.right - card.width;
    }
    if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
    if (left + card.width > vp.width - VIEWPORT_PAD) {
      left = vp.width - VIEWPORT_PAD - card.width;
    }
  } else {
    if (top + card.height > vp.height - VIEWPORT_PAD) {
      top = anchor.bottom - card.height;
    }
    if (top < VIEWPORT_PAD) top = VIEWPORT_PAD;
    if (top + card.height > vp.height - VIEWPORT_PAD) {
      top = vp.height - VIEWPORT_PAD - card.height;
    }
  }

  return { top, left };
}

export function FloatingCard({
  anchor,
  open,
  onClose,
  placement = "auto",
  className,
  children,
  role = "dialog",
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<ResolvedPosition | null>(null);
  // SSR-safe gate: server snapshot returns false, client snapshot returns
  // true — so the portal is mounted only after hydration without us having
  // to call setState in an effect. See `useHydrated` above.
  const hydrated = useHydrated();

  // Re-measure on a single requestAnimationFrame tick, coalesced across many
  // resize/scroll bursts. Reads the live anchor rect each time.
  const recompute = useCallback(() => {
    if (!anchor || !cardRef.current) return;
    const anchorRect = anchor.getBoundingClientRect();
    const cardEl = cardRef.current;
    // Card size: pre-existing dimensions if rendered; fall back to a sensible
    // estimate for the first paint.
    const cardSize = {
      width: cardEl.offsetWidth || 240,
      height: cardEl.offsetHeight || 80,
    };
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const { position: next } = resolvePlacement(placement, anchorRect, cardSize, viewport);
    setPosition(next);
  }, [anchor, placement]);

  // Position synchronously on mount/anchor-change. Layout effect avoids the
  // single-frame flash where the card renders at (0,0) before recompute.
  useIsoLayoutEffect(() => {
    if (!open || !anchor) {
      setPosition(null);
      return;
    }
    recompute();
  }, [open, anchor, recompute]);

  // Coalesce resize/scroll into one rAF so heavy scroll containers don't
  // thrash. Cleans up listeners when `open` flips false or anchor goes away.
  useEffect(() => {
    if (!open || !anchor) return;
    let frame: number | null = null;
    const onChange = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        recompute();
      });
    };
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [open, anchor, recompute]);

  // Focus trap + Escape — only for dialog role. Tooltips stay passive.
  useDialogFocus(cardRef, {
    onEscape: role === "dialog" && open ? onClose : undefined,
    restoreFocus: role === "dialog",
  });

  // Outside-click close (dialog only). Listen on the capture phase so a
  // mousedown that lands outside the card always fires before any inner
  // event might preventDefault. The anchor itself is treated as inside the
  // card so a click on the trigger does not double-toggle.
  useEffect(() => {
    if (!open || role !== "dialog") return;
    function onMouseDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (cardRef.current && cardRef.current.contains(target)) return;
      if (anchor && anchor.contains(target)) return;
      onClose();
    }
    document.addEventListener("mousedown", onMouseDown, true);
    return () => document.removeEventListener("mousedown", onMouseDown, true);
  }, [open, role, anchor, onClose]);

  if (!open) return null;
  if (!hydrated || !isClient()) return null;

  // Style: until `position` is computed (first frame after mount), keep the
  // card invisible to avoid a (0,0) flash. After that, fixed-position to the
  // resolved coordinates.
  const style: CSSProperties =
    position === null
      ? { position: "fixed", top: 0, left: 0, visibility: "hidden", pointerEvents: "none" }
      : { position: "fixed", top: position.top, left: position.left };

  return createPortal(
    <div
      ref={cardRef}
      role={role}
      aria-modal={role === "dialog" ? true : undefined}
      className={clsx("floating-card", className)}
      style={style}
    >
      {children}
    </div>,
    document.body,
  );
}
