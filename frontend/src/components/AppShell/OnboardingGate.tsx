"use client";

// OnboardingGate — pushes the user between `/onboarding` and the rest of
// the app based on the persisted `onboarded` preference. Lives as a leaf
// inside AppShell so the shell itself can stay a Server Component.
//
// We capture the most recently requested redirect target in a ref so we
// don't issue the same `router.push()` multiple times while the route
// transition is settling. Issuing `/onboarding` twice is harmless, but
// re-issuing it after the user navigates away mid-flow would tug them back.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { usePreferences } from "@/hooks/usePreferences";

export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { preferences } = usePreferences();
  const lastRedirectRef = useRef<string | null>(null);
  const onOnboarding = pathname === "/onboarding";

  useEffect(() => {
    let target: "/onboarding" | "/" | null = null;
    if (!onOnboarding && preferences.onboarded === false) target = "/onboarding";
    if (onOnboarding && preferences.onboarded === true) target = "/";

    if (target === null) {
      lastRedirectRef.current = null;
      return;
    }
    if (lastRedirectRef.current === target) return;
    lastRedirectRef.current = target;
    router.push(target);
  }, [onOnboarding, preferences.onboarded, router]);

  return null;
}
