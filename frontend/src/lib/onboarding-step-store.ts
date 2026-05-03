// Onboarding step persistence — small localStorage shim. The step is a
// transient cursor through the four-stage flow, not a long-lived
// preference, so we keep it in its own key rather than bloating
// `mishkat:preferences:v1`. Pattern follows `lib/notes-store.ts`: pure
// functions over localStorage, no React, swallowing quota / privacy-mode
// errors so a failing write doesn't break the flow.

const STORAGE_KEY = "mishkat:onboarding:step";
const MIN_STEP = 1;
const MAX_STEP = 4;

export type OnboardingStep = 1 | 2 | 3 | 4;

function isOnboardingStep(value: number): value is OnboardingStep {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function readOnboardingStep(): OnboardingStep {
  if (typeof window === "undefined") return 1;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return 1;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return 1;
    if (parsed < MIN_STEP || parsed > MAX_STEP) return 1;
    if (!isOnboardingStep(parsed)) return 1;
    return parsed;
  } catch {
    return 1;
  }
}

export function writeOnboardingStep(step: OnboardingStep): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(step));
  } catch {
    // Quota / privacy mode — silently drop.
  }
}

export function clearOnboardingStep(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Quota / privacy mode — silently drop.
  }
}
