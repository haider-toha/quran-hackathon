"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType } from "react";

import {
  BookIcon,
  CompassIcon,
  type IconProps,
  LibraryIcon,
  PenIcon,
  SettingsIcon,
  SidebarIcon,
  SparkleIcon,
} from "@/components/Icon";
import { kbdChord } from "@/lib/kbd";
import { RECENT_ITEMS } from "@/lib/mock-data";
import type { AppRoute } from "@/types";

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
  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className={clsx("sidebar", collapsed && "collapsed-inner")} aria-label="Primary">
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

      <div className="recent">
        <div className="nav-label">Recent</div>
        <div className="recent-list">
          {RECENT_ITEMS.map((item) => (
            <Link key={item.id} href="/journal" className="recent-item">
              <span className="ref">{item.ref}</span>
              <span className="ttl">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar-foot">
        <Link href="/settings?tab=sources" className="source-pill">
          <span className="dot" aria-hidden />
          <span className="lbl">Sources</span>
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
          <div className="avatar" aria-hidden lang="ar">
            س
          </div>
          <div className="foot-detail">
            <div className="name">Sami</div>
            <div className="meta">Juz Amma · 8 notes</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
