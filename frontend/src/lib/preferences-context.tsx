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

import { TAFSIR_SOURCES } from "@/lib/mock-data";
import {
  DEFAULT_PREFERENCES,
  type LastRead,
  type LibraryView,
  type Preferences,
  type ReaderMode,
  type ResponseStyle,
  type Rooting,
  type SuggestionFrequency,
  type SuggestionsSurface,
  type Theme,
  type VerseRef,
} from "@/types";

type PreferencesContextValue = {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  toggleTheme: () => void;
  reset: () => void;
  setLastRead: (ref: VerseRef) => void;
  markOnboarded: () => void;
};

const STORAGE_KEY = "mishkat:preferences:v1";

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Allowlists for every enum-shaped preference. localStorage is hostile
// input (extension tampering, schema drift, XSS in another origin); narrow
// once at the boundary so downstream typed access is safe.
const THEMES: readonly Theme[] = ["light", "dark"];
const ROOTINGS: readonly Rooting[] = ["manuscript", "modern", "neutral"];
const READER_MODES: readonly ReaderMode[] = [
  "interleaved",
  "mushaf",
  "translation",
  "side-by-side",
];
const RESPONSE_STYLES: readonly ResponseStyle[] = ["brief", "standard", "comparative"];
const SUGGESTIONS_SURFACES: readonly SuggestionsSurface[] = ["rail", "off"];
const SUGGESTION_FREQUENCIES: readonly SuggestionFrequency[] = ["high", "low", "off"];
const LIBRARY_VIEWS: readonly LibraryView[] = ["cards", "table"];

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function defaultEnabledSources(): readonly string[] {
  return TAFSIR_SOURCES.filter((s) => s.enabledByDefault).map((s) => s.id);
}

function pickEnabledSources(input: unknown): readonly string[] {
  if (!Array.isArray(input)) return defaultEnabledSources();
  const valid = new Set(TAFSIR_SOURCES.map((s) => s.id));
  const ids = input.filter((v): v is string => typeof v === "string" && valid.has(v));
  // Empty array is a legitimate user choice (turn everything off).
  return ids;
}

function pickLastRead(input: unknown): LastRead {
  if (!isPlainObject(input)) return null;
  const { surah, ayah, timestamp } = input;
  if (
    typeof surah !== "number" ||
    typeof ayah !== "number" ||
    typeof timestamp !== "number" ||
    !Number.isFinite(surah) ||
    !Number.isFinite(ayah) ||
    !Number.isFinite(timestamp) ||
    surah < 1 ||
    ayah < 1
  ) {
    return null;
  }
  return { surah, ayah, timestamp };
}

function validatePreferences(input: unknown): Preferences {
  if (!isPlainObject(input))
    return { ...DEFAULT_PREFERENCES, enabledSources: defaultEnabledSources() };

  // Backwards compat: pre-v3 stored a `marginalia: boolean` field. Map it
  // onto the new `showReflectionPrompts` if the new key isn't present.
  const showReflectionPrompts =
    typeof input.showReflectionPrompts === "boolean"
      ? input.showReflectionPrompts
      : typeof input.marginalia === "boolean"
        ? input.marginalia
        : DEFAULT_PREFERENCES.showReflectionPrompts;

  const recitationEnabled =
    typeof input.recitationEnabled === "boolean"
      ? input.recitationEnabled
      : typeof input.recitation === "boolean"
        ? input.recitation
        : DEFAULT_PREFERENCES.recitationEnabled;

  return {
    theme: pick(THEMES, input.theme, DEFAULT_PREFERENCES.theme),
    rooting: pick(ROOTINGS, input.rooting, DEFAULT_PREFERENCES.rooting),
    onboarded: typeof input.onboarded === "boolean" ? input.onboarded : false,
    enabledSources:
      "enabledSources" in input
        ? pickEnabledSources(input.enabledSources)
        : defaultEnabledSources(),
    responseStyle: pick(RESPONSE_STYLES, input.responseStyle, DEFAULT_PREFERENCES.responseStyle),
    readerMode: pick(READER_MODES, input.readerMode, DEFAULT_PREFERENCES.readerMode),
    showReflectionPrompts,
    recitationEnabled,
    suggestionsSurface: pick(
      SUGGESTIONS_SURFACES,
      input.suggestionsSurface,
      DEFAULT_PREFERENCES.suggestionsSurface,
    ),
    suggestionFrequency: pick(
      SUGGESTION_FREQUENCIES,
      input.suggestionFrequency,
      DEFAULT_PREFERENCES.suggestionFrequency,
    ),
    libraryView: pick(LIBRARY_VIEWS, input.libraryView, DEFAULT_PREFERENCES.libraryView),
    lastRead: pickLastRead(input.lastRead),
  };
}

function readStored(): Preferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PREFERENCES, enabledSources: defaultEnabledSources() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, enabledSources: defaultEnabledSources() };
    return validatePreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFERENCES, enabledSources: defaultEnabledSources() };
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
    setPreferences({ ...DEFAULT_PREFERENCES, enabledSources: defaultEnabledSources() });
  }, []);

  const setLastRead = useCallback((ref: VerseRef) => {
    setPreferences((prev) => ({
      ...prev,
      lastRead: { surah: ref.surah, ayah: ref.ayah, timestamp: Date.now() },
    }));
  }, []);

  const markOnboarded = useCallback(() => {
    setPreferences((prev) => (prev.onboarded ? prev : { ...prev, onboarded: true }));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, setPreference, toggleTheme, reset, setLastRead, markOnboarded }),
    [preferences, setPreference, toggleTheme, reset, setLastRead, markOnboarded],
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

// Inline pre-paint script that mirrors the React validation above for the
// only two fields that affect first paint (theme + rooting). Same allowlists,
// no `parsed.theme === 'dark'` shortcut so a tampered value can't smuggle
// anything past — both fields are explicitly enumerated.
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
