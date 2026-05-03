// Pre-paint script that mirrors the React validation in
// `hooks/usePreferences.tsx` for the only two fields that affect first
// paint (theme + rooting). Same allowlists, no
// `parsed.theme === 'dark'` shortcut so a tampered value can't smuggle
// anything past — both fields are explicitly enumerated.
//
// Lives in `lib/` (not `hooks/`) because it has zero React surface — the
// root layout injects this string into a `<script>` tag.

const STORAGE_KEY = "mishkat:preferences:v1";

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
