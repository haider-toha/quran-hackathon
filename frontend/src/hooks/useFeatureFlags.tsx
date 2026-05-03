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

import { isPlainObject } from "@/lib/validators";
import type { FeatureFlags } from "@/types";

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

// Statically declared key list so we can iterate without a runtime cast.
// Keep in sync with `FeatureFlags` and `DEFAULT_FLAGS`.
const FLAG_KEYS: readonly (keyof FeatureFlags)[] = [
  "slashCommands",
  "suggestionsRail",
  "deepResearch",
  "recitation",
  "notesExport",
  "deleteAccount",
  "adminAskStateLow",
] as const;

type FlagsContextValue = {
  flags: FeatureFlags;
  setFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void;
};

const FlagsContext = createContext<FlagsContextValue | null>(null);

function validateFlags(input: unknown): FeatureFlags {
  if (!isPlainObject(input)) return DEFAULT_FLAGS;
  // Narrow each known key to a boolean; unknown keys are dropped. Don't
  // trust localStorage to give back the right shape after a schema change.
  const out: FeatureFlags = { ...DEFAULT_FLAGS };
  for (const key of FLAG_KEYS) {
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
