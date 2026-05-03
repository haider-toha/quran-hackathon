"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState, type MouseEvent } from "react";

import { PauseIcon, PlayIcon } from "@/components/Icon";

type Props = {
  surah: number;
  ayah: number;
};

// Pad to the everyayah.com naming convention (3-digit zero-padded surah + ayah).
function recitationUrl(surah: number, ayah: number): string {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
}

// Module-scoped singleton so only ONE ayah ever plays at a time across the
// whole reader. Components subscribe via `subscribe()`; switching to a new
// (surah, ayah) stops the previous element. Audio is created lazily — we do
// not preload anything.
type Listener = (key: string | null) => void;

let currentEl: HTMLAudioElement | null = null;
let currentKey: string | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l(currentKey);
}

function keyOf(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

function stop() {
  if (currentEl) {
    currentEl.pause();
    currentEl.src = "";
    currentEl = null;
  }
  currentKey = null;
  notify();
}

function play(surah: number, ayah: number, onEnded: () => void) {
  // If something else is playing, stop it first.
  stop();
  const url = recitationUrl(surah, ayah);
  const el = new Audio(url);
  el.preload = "none";
  currentEl = el;
  currentKey = keyOf(surah, ayah);

  function cleanup() {
    if (currentEl === el) {
      currentEl = null;
      currentKey = null;
    }
    notify();
    onEnded();
  }

  el.addEventListener("ended", cleanup);
  el.addEventListener("error", () => {
    // The CDN can 404; we log and bail rather than surfacing a toast for v3.
    console.warn("AyahAudio: failed to play", url);
    cleanup();
  });

  el.play().catch((err: unknown) => {
    console.warn("AyahAudio: play() rejected", err);
    cleanup();
  });
  notify();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function AyahAudio({ surah, ayah }: Props) {
  const myKey = keyOf(surah, ayah);
  const [activeKey, setActiveKey] = useState<string | null>(currentKey);
  const isPlaying = activeKey === myKey;

  useEffect(() => {
    return subscribe(setActiveKey);
  }, []);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      // Don't bubble up to the row/pair wrapper (which selects the ayah).
      event.stopPropagation();
      if (isPlaying) {
        stop();
        return;
      }
      play(surah, ayah, () => undefined);
    },
    [isPlaying, surah, ayah],
  );

  return (
    <button
      type="button"
      className={clsx("ayah-audio", isPlaying && "playing")}
      onClick={handleClick}
      aria-label={`${isPlaying ? "Pause" : "Play"} verse ${surah}:${ayah}`}
      aria-pressed={isPlaying}
    >
      {isPlaying ? <PauseIcon size={11} /> : <PlayIcon size={11} />}
    </button>
  );
}
