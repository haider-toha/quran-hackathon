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
import { isPlainObject, pick } from "@/lib/validators";
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

type PreferencesActions = {
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  toggleTheme: () => void;
  reset: () => void;
  setLastRead: (ref: VerseRef) => void;
  markOnboarded: () => void;
};

const STORAGE_KEY = "mishkat:preferences:v1";

// Two contexts so consumers that only need to read a single field don't
// re-render every time *any* preference changes. The actions context value
// is referentially stable (all callbacks wrapped in `useCallback`); the
// value context updates on each `setPreferences`.
const PreferencesValueContext = createContext<Preferences | null>(null);
const PreferencesActionsContext = createContext<PreferencesActions | null>(null);

// Allowlists for every enum-shaped preference. localStorage is hostile
// input (extension tampering, schema drift, XSS in another origin); narrow
// once at the boundary so downstream typed access is safe.
const THEMES: readonly Theme[] = ["light", "dark"];
const ROOTINGS: readonly Rooting[] = ["manuscript", "modern", "neutral"];
const READER_MODES: readonly ReaderMode[] = ["interleaved", "mushaf", "translation"];
const RESPONSE_STYLES: readonly ResponseStyle[] = ["brief", "standard", "comparative"];
const SUGGESTIONS_SURFACES: readonly SuggestionsSurface[] = ["rail", "off"];
const SUGGESTION_FREQUENCIES: readonly SuggestionFrequency[] = ["high", "low", "off"];
const LIBRARY_VIEWS: readonly LibraryView[] = ["cards", "table"];

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

  const actions = useMemo<PreferencesActions>(
    () => ({ setPreference, toggleTheme, reset, setLastRead, markOnboarded }),
    [setPreference, toggleTheme, reset, setLastRead, markOnboarded],
  );

  return (
    <PreferencesActionsContext.Provider value={actions}>
      <PreferencesValueContext.Provider value={preferences}>
        {children}
      </PreferencesValueContext.Provider>
    </PreferencesActionsContext.Provider>
  );
}

function useValueContext(): Preferences {
  const value = useContext(PreferencesValueContext);
  if (!value) {
    throw new Error("usePreferences must be used inside <PreferencesProvider>");
  }
  return value;
}

export function usePreferenceActions(): PreferencesActions {
  const value = useContext(PreferencesActionsContext);
  if (!value) {
    throw new Error("usePreferenceActions must be used inside <PreferencesProvider>");
  }
  return value;
}

// Combined hook kept for backwards compatibility with the v3 codebase.
// New code should prefer the granular selector hooks below to avoid
// re-rendering on unrelated preference changes.
type PreferencesContextValue = {
  preferences: Preferences;
} & PreferencesActions;

export function usePreferences(): PreferencesContextValue {
  const preferences = useValueContext();
  const actions = usePreferenceActions();
  return { preferences, ...actions };
}

// ── Selector hooks ────────────────────────────────────────────────────────
// Each selector reads a single field from the value context. Components
// that only depend on one field can subscribe via the matching selector.
// (Note: React context still re-renders all consumers when the provider
// value changes; the split between value and actions contexts is what
// gives us the real win — components that only need actions never
// re-render on preference updates.)

export function usePreferenceTheme(): Preferences["theme"] {
  return useValueContext().theme;
}

export function usePreferenceRooting(): Preferences["rooting"] {
  return useValueContext().rooting;
}

export function usePreferenceLastRead(): Preferences["lastRead"] {
  return useValueContext().lastRead;
}

export function usePreferenceView(): Preferences["libraryView"] {
  return useValueContext().libraryView;
}

export function usePreferenceResponseStyle(): Preferences["responseStyle"] {
  return useValueContext().responseStyle;
}
