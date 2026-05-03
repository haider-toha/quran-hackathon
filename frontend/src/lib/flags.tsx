"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { FeatureFlags } from "@/types";

declare global {
  interface Window {
    __MISHKAT_ADMIN__?: boolean;
  }
}

const ADMIN_STORAGE_KEY = "mishkat_admin";
const FLAGS_STORAGE_KEY = "mishkat:flags:v1";

export const DEFAULT_FLAGS: FeatureFlags = {
  slashCommands: true,
  suggestionsRail: true,
  deepResearch: true,
  recitation: true,
  notesExport: false,
  deleteAccount: false,
  adminAskStateLow: false,
};

type FlagsContextValue = {
  flags: FeatureFlags;
  setFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void;
};

const FlagsContext = createContext<FlagsContextValue | null>(null);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateFlags(input: unknown): FeatureFlags {
  if (!isPlainObject(input)) return DEFAULT_FLAGS;
  // Narrow each known key to a boolean; unknown keys are dropped. Don't
  // trust localStorage to give back the right shape after a schema change.
  const out: FeatureFlags = { ...DEFAULT_FLAGS };
  for (const key of Object.keys(DEFAULT_FLAGS) as (keyof FeatureFlags)[]) {
    const candidate = input[key];
    if (typeof candidate === "boolean") out[key] = candidate;
  }
  return out;
}

function readStoredFlags(): FeatureFlags {
  if (typeof window === "undefined") return DEFAULT_FLAGS;
  try {
    const raw = window.localStorage.getItem(FLAGS_STORAGE_KEY);
    if (!raw) return DEFAULT_FLAGS;
    return validateFlags(JSON.parse(raw));
  } catch {
    return DEFAULT_FLAGS;
  }
}

export function FlagsProvider({ children }: { children: ReactNode }): ReactNode {
  const [flags, setFlags] = useState<FeatureFlags>(readStoredFlags);

  useEffect(() => {
    try {
      window.localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(flags));
    } catch {
      // Quota / privacy mode — flags won't persist this session.
    }
  }, [flags]);

  const setFlag = useCallback(<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => {
    setFlags((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo<FlagsContextValue>(() => ({ flags, setFlag }), [flags, setFlag]);

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

export function useFeatureFlags(): FeatureFlags {
  const value = useContext(FlagsContext);
  if (!value) {
    throw new Error("useFeatureFlags must be used inside <FlagsProvider>");
  }
  return value.flags;
}

export function useSetFlag(): <K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K],
) => void {
  const value = useContext(FlagsContext);
  if (!value) {
    throw new Error("useSetFlag must be used inside <FlagsProvider>");
  }
  return value.setFlag;
}

// ── Admin mode ────────────────────────────────────────────────────────────
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
