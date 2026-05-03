// AppShell — the static layout envelope for every authenticated route. Lives
// as a Server Component so the route root never drags the entire shell into
// the client bundle. All interactive state (sidebar collapse, command
// palette, surah picker) lives in client leaves rendered alongside the
// static layout.
//
// Onboarding is handled in two places: `<OnboardingGate />` redirects the
// user between `/onboarding` and the rest of the app based on the
// persisted `onboarded` preference, and `<OnboardingFrame />` decides which
// of the two static envelopes to mount — the bare onboarding-root wrapper
// or the regular sidebar+chrome shell.
//
// `<ChromeMain />` reads `?surah=` via `useSearchParams()`. Next.js requires
// that hook to live behind a `<Suspense>` boundary when the surrounding
// tree is being statically prerendered (which the layout is, now that
// AppShell is a Server Component). The static `.shell` grid and
// `<SidebarWithCollapse />` stay prerenderable; only the chrome-main
// subtree streams in client-side.

import { Suspense, type ReactNode } from "react";

import { Toaster } from "@/components/Toaster";

import { ChromeMain } from "./ChromeMain";
import { OnboardingFrame } from "./OnboardingFrame";
import { OnboardingGate } from "./OnboardingGate";
import { SidebarWithCollapse } from "./SidebarWithCollapse";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <OnboardingGate />
      <OnboardingFrame
        shell={
          <div className="shell">
            <SidebarWithCollapse />
            <Suspense fallback={null}>
              <ChromeMain>{children}</ChromeMain>
            </Suspense>
          </div>
        }
        onboarding={<div className="onboarding-root">{children}</div>}
      />
      <Toaster />
    </>
  );
}
