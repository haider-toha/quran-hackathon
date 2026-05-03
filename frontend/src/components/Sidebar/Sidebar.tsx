"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, type ComponentType } from "react";

import {
  BookIcon,
  CompassIcon,
  type IconProps,
  LibraryIcon,
  PenIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SidebarIcon,
  SparkleIcon,
} from "@/components/Icon";
import { useJournalChrome } from "@/components/Journal/JournalChromeContext";
import { NotificationsBell } from "@/components/Topbar/NotificationsBell";
import { openCommandPalette } from "@/hooks/useCommandPalette";
import { kbdChord } from "@/lib/kbd";
import type { AppRoute } from "@/types";

import { ChatHistorySection } from "./ChatHistorySection";

type NavItem = {
  href: AppRoute;
  label: string;
  shortcutKey: string;
  icon: ComponentType<IconProps>;
};

const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/", label: "Read", shortcutKey: "1", icon: BookIcon },
  { href: "/ask", label: "Ask", shortcutKey: "2", icon: SparkleIcon },
  { href: "/journal", label: "Journal", shortcutKey: "3", icon: PenIcon },
  { href: "/library", label: "Library", shortcutKey: "4", icon: LibraryIcon },
  { href: "/research", label: "Research", shortcutKey: "5", icon: CompassIcon },
];

type Props = {
  collapsed: boolean;
  onCollapseToggle: () => void;
  sourceCount: { active: number; total: number };
};

export function Sidebar({ collapsed, onCollapseToggle, sourceCount }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const journalChrome = useJournalChrome();
  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // "New chat" used to live in two places — the standalone Ask chat sidebar
  // had a button and the rail had a list-style entry below the nav. The
  // redesigned shell drops the list entry and keeps a single button at the
  // top of the chat-history section. Routing to /ask without a thread
  // parameter is the canonical "start new" action.
  const handleNewChat = useCallback(() => {
    router.push("/ask");
  }, [router]);

  // Phase 10 — the Sources pill is relevant on the reading/research surfaces
  // that consume tafsir sources, not on the Library archive of notes.
  // Surface the route via a data-attribute so globals.css can hide the
  // pill (and any future Library-only chrome tweaks) without forcing the
  // sidebar to know which children to omit.
  const onLibrary = pathname.startsWith("/library");

  // Phase 6 — the notifications bell relocated from the topbar into the
  // sidebar foot. While the journal is in compose mode the chrome should
  // be entirely silent, so we hide the bell there. Connect mode (and any
  // non-journal route) keeps it visible.
  const hideBell = journalChrome.isComposeChrome;

  return (
    <nav
      className={clsx("sidebar", collapsed && "collapsed-inner")}
      aria-label="Primary"
      data-on-library={onLibrary ? "true" : undefined}
    >
      <div className="brand">
        <div className="brand-mark" aria-hidden lang="ar">
          م
        </div>
        <div className="brand-name">Mishkat</div>
        <button
          type="button"
          className="collapse-btn"
          onClick={onCollapseToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <SidebarIcon size={14} />
        </button>
      </div>

      {/* Phase 6 — sidebar search button. Replaces the topbar's old search
          input. Uses the same hover-reveal pattern as the nav-item kbd
          hints: the ⌘K hint is hidden by default and fades in on hover.
          When the sidebar is collapsed to icons-only, the hint stays
          hidden via the existing `.collapsed-inner .kbd` rule. */}
      <button
        type="button"
        className="sidebar-search nav-item"
        onClick={() => openCommandPalette()}
        aria-label="Open command palette"
      >
        <span className="icon">
          <SearchIcon size={15} />
        </span>
        <span className="label">Search</span>
        <span className="kbd">{kbdChord("cmd", "K")}</span>
      </button>

      <div className="nav-group">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("nav-item", isActive(item.href) && "active")}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <span className="icon">
                <Icon size={15} />
              </span>
              <span className="label">{item.label}</span>
              <span className="kbd">{kbdChord("cmd", item.shortcutKey)}</span>
            </Link>
          );
        })}
      </div>

      {!collapsed ? (
        <div className="sidebar-chat-block">
          <button type="button" className="sidebar-new-chat-btn" onClick={handleNewChat}>
            <PlusIcon size={12} />
            <span>New chat</span>
          </button>
          <ChatHistorySection />
        </div>
      ) : null}

      <div className="sidebar-foot">
        {/* Phase 6 — notifications bell sits just above the source pill /
            settings entry / user avatar. Wrapping it in a row gives the
            popover something to anchor to and keeps the icon left-aligned
            with the other foot rows. Hidden in journal compose mode. */}
        {!hideBell ? (
          <div className="sidebar-bell-row">
            <NotificationsBell />
          </div>
        ) : null}
        <Link href="/settings?tab=sources" className="source-pill">
          <span className="dot" aria-hidden />
          <span className="lbl">Library</span>
          <span className="num">·&nbsp;{sourceCount.active} active</span>
        </Link>
        <Link href="/settings" className={clsx("nav-item", isActive("/settings") && "active")}>
          <span className="icon">
            <SettingsIcon size={15} />
          </span>
          <span className="label">Settings</span>
          <span className="kbd">{kbdChord("cmd", ",")}</span>
        </Link>
        <div className="foot-row">
          <div className="avatar" aria-hidden>
            <span className="avatar-initial">S</span>
          </div>
          <div className="foot-detail">
            <div className="name">Sami Faruqi</div>
            <div className="meta">Juz Amma · 8 notes</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
