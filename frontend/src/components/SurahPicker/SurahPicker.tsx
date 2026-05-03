"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

import { SearchIcon, XIcon } from "@/components/Icon";
import { JUZ_LABEL } from "@/lib/copy";
import { JUZ_AMMA_SURAHS } from "@/lib/mock-data";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import type { SurahSummary } from "@/types";

type Props = {
  anchor: HTMLElement | null;
  current: number;
  onClose: () => void;
  onSelect: (surahNumber: number) => void;
};

function computePosition(anchor: HTMLElement | null): { top: number; left: number } {
  if (!anchor) return { top: 0, left: 0 };
  const rect = anchor.getBoundingClientRect();
  return { top: rect.bottom + 6, left: rect.left };
}

export function SurahPicker({ anchor, current, onClose, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  // Position is a pure derivation of `anchor`'s viewport rect. The parent
  // mounts this popover only after the trigger is in the DOM, so reading
  // `getBoundingClientRect()` during render is safe — no need for state at
  // all. `useMemo` keys on the anchor reference; in the rare case the
  // parent swaps the trigger element, we recompute.
  const position = useMemo(() => computePosition(anchor), [anchor]);

  // Click outside the popover (and outside its anchoring trigger) closes it.
  // EventTarget can be a non-Node (e.g. window); guard with instanceof
  // rather than a blind cast.
  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!(event.target instanceof Node)) return;
      const target = event.target;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        anchor &&
        !anchor.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, [anchor, onClose]);

  useDialogFocus(containerRef, { onEscape: onClose });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo<readonly SurahSummary[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return JUZ_AMMA_SURAHS;
    return JUZ_AMMA_SURAHS.filter((s) => {
      return (
        s.transliteration.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        String(s.number).includes(q)
      );
    });
  }, [query]);

  return (
    <div
      ref={containerRef}
      className="popover"
      style={{ top: position.top, left: position.left, width: 480 }}
      role="dialog"
      aria-label="Pick a surah"
    >
      <div className="pop-search">
        <SearchIcon size={14} />
        <input
          ref={inputRef}
          placeholder={`Search ${JUZ_LABEL}…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            type="button"
            className="iconbtn"
            style={{ width: 22, height: 22 }}
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <XIcon size={12} />
          </button>
        )}
      </div>
      <div className="pop-list">
        <div className="pop-grid">
          {filtered.map((surah) => (
            <button
              key={surah.number}
              type="button"
              className={clsx("pop-item", surah.number === current && "active")}
              onClick={() => {
                onSelect(surah.number);
                onClose();
              }}
            >
              <span className="pop-no">{surah.number}</span>
              <span className="pop-arabic">{surah.arabic}</span>
              <span className="pop-name">
                {surah.transliteration}
                <span className="meaning">
                  {surah.meaning} · {surah.verseCount} verses
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="pop-foot">
        <span>
          {filtered.length} of {JUZ_AMMA_SURAHS.length}
        </span>
        <span>{JUZ_LABEL}</span>
      </div>
    </div>
  );
}
