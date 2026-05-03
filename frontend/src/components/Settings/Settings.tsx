"use client";

import clsx from "clsx";
import { useState } from "react";

import { useAdminMode } from "@/hooks/useAdminMode";

import { AccountSection } from "./AccountSection";
import { AdminSection } from "./AdminSection";
import { NotificationsSection } from "./NotificationsSection";
import { ReadingSection } from "./ReadingSection";
import { ResponseStyleSection } from "./ResponseStyleSection";
import { SourcesSection } from "./SourcesSection";
import { WritingSection } from "./WritingSection";

type Tab =
  | "sources"
  | "response-style"
  | "reading"
  | "writing"
  | "notifications"
  | "account"
  | "admin";

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: "sources", label: "Sources" },
  { id: "response-style", label: "Response style" },
  { id: "reading", label: "Reading" },
  { id: "writing", label: "Writing" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
];

const ADMIN_TAB: { id: Tab; label: string } = { id: "admin", label: "Admin (developer)" };

const VALID_TABS: readonly Tab[] = [
  "sources",
  "response-style",
  "reading",
  "writing",
  "notifications",
  "account",
  "admin",
];

function isTab(value: string): value is Tab {
  // String-narrowing predicate so callers can drop the `as Tab` cast at
  // the boundary where untrusted query-string input enters the component.
  return (VALID_TABS as readonly string[]).includes(value);
}

function pickTab(value: string | null | undefined): Tab {
  if (value && isTab(value)) return value;
  return "sources";
}

type Props = {
  initialTab: string | null;
};

export function Settings({ initialTab }: Props) {
  const { admin } = useAdminMode();
  const [tab, setTab] = useState<Tab>(() => pickTab(initialTab));

  // Snap back to a visible tab if admin mode flips off while we're on it.
  // React 19 "reset state on derived condition change" pattern — set during
  // render rather than in a useEffect so we don't cascade an extra paint.
  if (tab === "admin" && !admin) {
    setTab("sources");
  }

  const tabs = admin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <div className="settings settings-shell">
      <aside className="settings-aside" aria-label="Settings sections">
        <nav>
          <ul className="settings-nav">
            {tabs.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={clsx("settings-nav-item", tab === t.id && "on")}
                  aria-current={tab === t.id ? "page" : undefined}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="settings-pane">
        {tab === "sources" ? <SourcesSection /> : null}
        {tab === "response-style" ? <ResponseStyleSection /> : null}
        {tab === "reading" ? <ReadingSection /> : null}
        {tab === "writing" ? <WritingSection /> : null}
        {tab === "notifications" ? <NotificationsSection /> : null}
        {tab === "account" ? <AccountSection /> : null}
        {tab === "admin" && admin ? <AdminSection /> : null}
      </div>
    </div>
  );
}
