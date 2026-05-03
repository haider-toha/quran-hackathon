"use client";

import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    __MISHKAT_ADMIN__?: boolean;
  }
}

const ADMIN_STORAGE_KEY = "mishkat_admin";

// Persisted flag controlled by `Cmd/Ctrl+Shift+.` and overridable via
// `window.__MISHKAT_ADMIN__` for local debugging. Lives outside the flags
// context because it's bootstrapped from a different source (window flag +
// dedicated storage key) and toggled by a global key listener — keeping the
// flags context value stable across admin toggles avoids re-rendering every
// flag consumer when admin flips.

function readStoredAdmin(): boolean {
  if (typeof window === "undefined") return false;
  if (window.__MISHKAT_ADMIN__ === true) return true;
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export function useAdminMode(): { admin: boolean; toggle: () => void } {
  const [admin, setAdmin] = useState<boolean>(readStoredAdmin);

  // Global keyboard shortcut: Cmd+Shift+. on Mac, Ctrl+Shift+. elsewhere.
  // Listen on `window` so the chord works regardless of focus target.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModifier = event.metaKey || event.ctrlKey;
      if (!isModifier) return;
      if (!event.shiftKey) return;
      if (event.key !== "." && event.code !== "Period") return;
      event.preventDefault();
      setAdmin((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem(ADMIN_STORAGE_KEY, String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggle = useCallback(() => {
    setAdmin((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(ADMIN_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { admin, toggle };
}
