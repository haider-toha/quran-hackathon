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

import {
  DEFAULT_PREFERENCES,
  type LibraryView,
  type Preferences,
  type ReaderMode,
  type Rooting,
  type Suggestions,
  type Theme,
} from "@/types";

type PreferencesContextValue = {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  toggleTheme: () => void;
  reset: () => void;
};

const STORAGE_KEY = "mishkat:preferences:v1";

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Allowlists for every enum-shaped preference. localStorage is hostile
// input (extension tampering, schema drift, XSS in another origin); narrow
// once at the boundary so downstream typed access is safe.
const THEMES: readonly Theme[] = ["light", "dark"];
const ROOTINGS: readonly Rooting[] = ["manuscript", "modern", "neutral"];
const READER_MODES: readonly ReaderMode[] = ["mushaf", "both", "translation"];
const SUGGESTIONS: readonly Suggestions[] = ["margin", "ghost", "rail"];
const LIBRARY_VIEWS: readonly LibraryView[] = ["cards", "table"];

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePreferences(input: unknown): Preferences {
  if (!isPlainObject(input)) return DEFAULT_PREFERENCES;
  return {
    theme: pick(THEMES, input.theme, DEFAULT_PREFERENCES.theme),
    rooting: pick(ROOTINGS, input.rooting, DEFAULT_PREFERENCES.rooting),
    readerMode: pick(READER_MODES, input.readerMode, DEFAULT_PREFERENCES.readerMode),
    marginalia:
      typeof input.marginalia === "boolean" ? input.marginalia : DEFAULT_PREFERENCES.marginalia,
    recitation:
      typeof input.recitation === "boolean" ? input.recitation : DEFAULT_PREFERENCES.recitation,
    suggestions: pick(SUGGESTIONS, input.suggestions, DEFAULT_PREFERENCES.suggestions),
    libraryView: pick(LIBRARY_VIEWS, input.libraryView, DEFAULT_PREFERENCES.libraryView),
  };
}

function readStored(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return validatePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }): ReactNode {
  // Lazy initializer reads localStorage on the first client render.
  // On the server it returns defaults; the bootstrap script in `layout.tsx`
  // sets `data-theme`/`data-rooting` from localStorage before hydration so
  // the visual surface stays in sync even before this provider mounts.
  const [preferences, setPreferences] = useState<Preferences>(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Quota / privacy mode — preferences won't persist this session.
    }
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.rooting = preferences.rooting;
  }, [preferences]);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  }, []);

  const reset = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, setPreference, toggleTheme, reset }),
    [preferences, setPreference, toggleTheme, reset],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error("usePreferences must be used inside <PreferencesProvider>");
  }
  return value;
}

// Inline pre-paint script that mirrors the React validation above. Same
// allowlists, no `parsed.theme === 'dark'` shortcut so a tampered value
// can't smuggle anything past — both fields are explicitly enumerated.
export const PREFERENCES_BOOTSTRAP_SCRIPT = `(() => {
  try {
    const raw = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    const parsed = raw ? JSON.parse(raw) : {};
    const root = document.documentElement;
    root.dataset.theme = ['light','dark'].includes(parsed && parsed.theme) ? parsed.theme : 'light';
    root.dataset.rooting = ['manuscript','modern','neutral'].includes(parsed && parsed.rooting) ? parsed.rooting : 'neutral';
  } catch (_err) {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.dataset.rooting = 'neutral';
  }
})();`;
