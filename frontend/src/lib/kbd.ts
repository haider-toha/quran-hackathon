// Platform-aware keyboard label utility. SSR-safe: at module-load time there
// is no `window` / `navigator`, so the platform check is lazy and memoized.

let cachedIsMac: boolean | null = null;

export function isMac(): boolean {
  if (cachedIsMac !== null) return cachedIsMac;
  if (typeof navigator === "undefined") {
    // Don't memoize the SSR answer — the next call from the client should
    // re-evaluate against the real navigator.
    return false;
  }
  // navigator.platform is deprecated but still the most reliable Mac
  // detector across browsers in 2026. userAgent fallback if it's empty.
  const platform = navigator.platform ?? "";
  const ua = navigator.userAgent ?? "";
  cachedIsMac = /Mac|iPhone|iPad|iPod/i.test(platform) || /Macintosh/i.test(ua);
  return cachedIsMac;
}

const MAC_KEY_GLYPHS: Record<string, string> = {
  cmd: "⌘",
  command: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧",
  enter: "↵",
  return: "↵",
  esc: "⎋",
  escape: "⎋",
  tab: "⇥",
  backspace: "⌫",
  delete: "⌦",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const NON_MAC_KEY_NAMES: Record<string, string> = {
  cmd: "Ctrl",
  command: "Ctrl",
  meta: "Ctrl",
  ctrl: "Ctrl",
  control: "Ctrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  enter: "Enter",
  return: "Enter",
  esc: "Esc",
  escape: "Esc",
  tab: "Tab",
};

function normalizeMac(raw: string): string {
  const lower = raw.toLowerCase();
  return MAC_KEY_GLYPHS[lower] ?? raw.toUpperCase();
}

function normalizeOther(raw: string): string {
  const lower = raw.toLowerCase();
  return NON_MAC_KEY_NAMES[lower] ?? raw.toUpperCase();
}

/**
 * Render a single key label (e.g. "K", "cmd"). On Mac, modifiers collapse
 * to glyphs; on other platforms they spell out as words.
 */
export function kbdLabel(key: string): string {
  if (isMac()) {
    const lower = key.toLowerCase();
    // On Mac the canonical Cmd+K is rendered "⌘K" (no separator). Treat a
    // bare modifier as a glyph; treat a bare letter/digit as uppercase.
    if (MAC_KEY_GLYPHS[lower]) return MAC_KEY_GLYPHS[lower];
    if (key.length === 1) return key.toUpperCase();
    return key;
  }
  return normalizeOther(key);
}

/**
 * Render a chord like ("Cmd", "K") -> "⌘K" on Mac, "Ctrl+K" on others.
 * On Mac, modifiers stack as glyphs with no separator.
 */
export function kbdChord(...keys: string[]): string {
  if (keys.length === 0) return "";
  if (isMac()) {
    return keys.map(normalizeMac).join("");
  }
  return keys.map(normalizeOther).join("+");
}
