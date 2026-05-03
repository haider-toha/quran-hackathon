"use client";

import { useSyncExternalStore } from "react";

import {
  type DevFeatureFlag,
  isFeatureFlagEnabled,
  subscribeFeatureFlag,
} from "@/lib/feature-flags";

/**
 * Subscribe to a single dev feature flag from `lib/feature-flags`. SSR-safe
 * via the third argument to `useSyncExternalStore` — server renders use the
 * compile-time default for the flag, then the client reads from localStorage
 * on hydration. Cross-tab toggles propagate via the storage event listener
 * installed by `subscribeFeatureFlag`.
 */
export function useFeatureFlag(flag: DevFeatureFlag): boolean {
  return useSyncExternalStore(
    (listener) => subscribeFeatureFlag(flag, listener),
    () => isFeatureFlagEnabled(flag),
    () => isFeatureFlagEnabled(flag),
  );
}
