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

import { GlobalCommandPalette } from "@/components/CommandPalette";
import { JournalChromeProvider } from "@/components/Journal/JournalChromeContext";
import { Toaster } from "@/components/Toaster";

import { ChromeMain } from "./ChromeMain";
import { HelpOverlay } from "./HelpOverlay";
import { OnboardingFrame } from "./OnboardingFrame";
import { OnboardingGate } from "./OnboardingGate";
import { SidebarWithCollapse } from "./SidebarWithCollapse";

export function AppShell({ children }: { children: ReactNode }) {
  // `JournalChromeProvider` lives at the shell root so the Sidebar (a
  // sibling of `{children}`) and Topbar (rendered inside `ChromeMain`)
  // share a single source of truth for the journal's compose-mode chrome
  // override. Outside `/journal` (or with the v2 flag off) the provider
  // simply holds its inert default value — `useChromeBinding` is a no-op
  // until JournalV2 mounts.
  return (
    <JournalChromeProvider>
      <OnboardingGate />
      <OnboardingFrame
        shell={
          <div className="shell">
            {/*
              Both the sidebar (ChatHistorySection reads `?thread=`) and the
              chrome-main subtree (SurahCrumb reads `?surah=`) call
              useSearchParams. Next.js requires those calls to sit behind a
              Suspense boundary when the route is statically prerendered;
              keep the boundaries scoped tightly so each subtree streams
              independently rather than stalling on the slowest sibling.
            */}
            <Suspense fallback={null}>
              <SidebarWithCollapse />
            </Suspense>
            <Suspense fallback={null}>
              <ChromeMain>{children}</ChromeMain>
            </Suspense>
          </div>
        }
        onboarding={<div className="onboarding-root">{children}</div>}
      />
      <Toaster />
      <HelpOverlay />
      {/* Phase 6 — palette mounts globally so ⌘K and the sidebar search
          button work from every route, including onboarding. The palette
          itself returns `null` when its store is closed. */}
      <GlobalCommandPalette />
    </JournalChromeProvider>
  );
}
