"use client";

// OnboardingFrame — switches between the onboarding bare-frame layout and
// the regular shell chrome based on `pathname === "/onboarding"`. Lives as
// a leaf inside AppShell so the shell itself can stay a Server Component.
//
// The onboarding flow has its own header (brand + step pips + skip) and
// would fight with the sidebar/topbar, so we render `{onboarding}` inside
// a dedicated `.onboarding-root` wrapper instead of the full `.shell` grid.
//
// Both subtrees are passed in by the parent. Only one is mounted at a time
// — when we're on `/onboarding` the regular shell unmounts and vice versa
// — so transient state in either side resets cleanly.

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  /** The full-shell chrome, mounted everywhere except `/onboarding`. */
  shell: ReactNode;
  /** The bare onboarding wrapper, mounted only on `/onboarding`. */
  onboarding: ReactNode;
};

export function OnboardingFrame({ shell, onboarding }: Props) {
  const pathname = usePathname();
  if (pathname === "/onboarding") {
    return <>{onboarding}</>;
  }
  return <>{shell}</>;
}
