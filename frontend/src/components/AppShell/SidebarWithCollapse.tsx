"use client";

// SidebarWithCollapse — owns the sidebar's collapse state. Lives as a leaf
// inside AppShell so the shell itself can stay a Server Component.
//
// The `.shell` outer grid reads its column width from `var(--sidebar-w, 232px)`,
// so this component drives the collapse animation by writing that variable
// onto the document root rather than relying on a `.collapsed` class on a
// server-rendered ancestor. The `.collapsed` class on the .shell div remains
// supported by CSS but is no longer required for the visual effect.
//
// When the journal page enters Compose mode (v2), it publishes
// `isComposeChrome: true` through the `JournalChromeContext`. This component
// then forces the sidebar into its collapsed (icon-only) form regardless
// of the user's manual collapse state. Leaving compose mode (or unmounting
// the journal entirely) restores the user's prior state.

import { useCallback, useEffect, useState } from "react";

import { useJournalChrome } from "@/components/Journal/JournalChromeContext";
import { Sidebar } from "@/components/Sidebar";
import { TAFSIR_SOURCES } from "@/lib/mock-data";

const SIDEBAR_WIDTH_EXPANDED = "232px";
const SIDEBAR_WIDTH_COLLAPSED = "56px";

const SOURCE_COUNT = {
  active: TAFSIR_SOURCES.filter((s) => s.enabledByDefault).length,
  total: TAFSIR_SOURCES.length,
};

export function SidebarWithCollapse() {
  const [userCollapsed, setUserCollapsed] = useState(false);
  const onCollapseToggle = useCallback(() => setUserCollapsed((c) => !c), []);

  const journalChrome = useJournalChrome();
  // Force-collapse when the journal page is in Compose mode. The user's
  // manual `userCollapsed` flag still applies on every other page, so
  // toggling out of compose returns the sidebar to whatever state the
  // user had it in.
  const collapsed = journalChrome.isComposeChrome || userCollapsed;

  // Mirror collapse state onto the root `--sidebar-w` so `.shell`'s grid
  // template responds without needing a class modifier on a server-rendered
  // ancestor. Cleared on unmount to avoid leaking the override.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--sidebar-w",
      collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
    );
    return () => {
      root.style.removeProperty("--sidebar-w");
    };
  }, [collapsed]);

  return (
    <Sidebar collapsed={collapsed} onCollapseToggle={onCollapseToggle} sourceCount={SOURCE_COUNT} />
  );
}
