"use client";

// Global keyboard-shortcut handler. Lives as a leaf inside AppShell so the
// shell itself can stay a Server Component. Listens on `document` and only
// fires when meta/ctrl is held — no accidental capture of plain typing.
//
// The Cmd-K case calls back into the parent because the command-palette
// open/close state lives next to the rendered <CommandPalette> instance.
// Every other shortcut is a pure router push.

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { AppRoute } from "@/types";

const SHORTCUT_TARGETS: Readonly<Record<string, AppRoute>> = {
  "1": "/",
  "2": "/ask",
  "3": "/journal",
  "4": "/library",
  "5": "/research",
  ",": "/settings",
};

type Props = {
  onOpenCommandPalette: () => void;
};

export function KeyboardShortcuts({ onOpenCommandPalette }: Props) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenCommandPalette();
        return;
      }
      const target = SHORTCUT_TARGETS[event.key];
      if (target) {
        event.preventDefault();
        router.push(target);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router, onOpenCommandPalette]);

  return null;
}
