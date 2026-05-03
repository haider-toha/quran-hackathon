"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { BellIcon } from "@/components/Icon";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import {
  clearAll,
  markRead,
  readNotifications,
  subscribeNotifications,
  type Notification,
} from "@/lib/notifications-store";

const EMPTY_NOTIFICATIONS: readonly Notification[] = [];

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// useSyncExternalStore subscribes to the notifications module and returns a
// stable snapshot per render. Avoids the "setState inside useEffect" lint
// rule, and gives us a real cross-component subscription model — when the
// Research deep-research timer fires, every mounted bell re-renders.
function useNotifications(): readonly Notification[] {
  return useSyncExternalStore(
    subscribeNotifications,
    () => readNotifications(),
    () => EMPTY_NOTIFICATIONS,
  );
}

export function NotificationsBell() {
  const items = useNotifications();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click-outside closes the popover. Escape is wired via `useDialogFocus`
  // below so the same hook handles tab-trapping and focus restoration.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Focus trap + Escape — only when the popover is open. The hook records
  // the previously focused element on mount and restores it on unmount, so
  // the bell button regains focus when the popover closes.
  useDialogFocus(popoverRef, {
    onEscape: open ? () => setOpen(false) : undefined,
    restoreFocus: open,
  });

  const unreadCount = items.filter((n) => !n.read).length;
  const hasNotifications = items.length > 0;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={buttonRef}
        type="button"
        className="iconbtn"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{ position: "relative" }}
      >
        <BellIcon size={15} />
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="bell-pulse"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--color-accent)",
              border: "1.5px solid var(--color-bg)",
            }}
          />
        ) : null}
      </button>
      {open ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 40,
            width: 320,
            maxHeight: 380,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-bg-elev)",
            border: "1px solid var(--color-line-strong)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderBottom: "1px solid var(--color-line)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-ink)",
              }}
            >
              Notifications
            </span>
            {hasNotifications ? (
              <button
                type="button"
                onClick={() => clearAll()}
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  fontSize: 11.5,
                  color: "var(--color-ink-3)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear all
              </button>
            ) : null}
          </div>
          <div style={{ overflowY: "auto", maxHeight: 320 }}>
            {hasNotifications ? (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {items.map((item, index) => (
                  <li
                    key={`${item.id}-${item.createdAt}`}
                    // `--n` drives the per-item entrance delay in
                    // `.notif-row` so the popover reads as a stagger reveal.
                    className="notif-row"
                    style={
                      {
                        borderBottom: "1px solid var(--color-line-2)",
                        "--n": index,
                      } as React.CSSProperties
                    }
                  >
                    <NotificationRow item={item} onActivate={() => markRead(item.id)} />
                  </li>
                ))}
              </ul>
            ) : (
              <div
                style={{
                  padding: "20px 14px",
                  fontSize: 12.5,
                  color: "var(--color-ink-3)",
                  textAlign: "center",
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                }}
              >
                No new notifications.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({ item, onActivate }: { item: Notification; onActivate: () => void }) {
  const body = (
    <div
      style={{
        padding: "10px 12px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        cursor: item.href ? "pointer" : "default",
        background: item.read ? "transparent" : "var(--color-accent-softer)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          marginTop: 6,
          background: item.read ? "var(--color-ink-5)" : "var(--color-accent)",
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--color-ink)",
            marginBottom: 2,
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--color-ink-3)",
            lineHeight: 1.45,
            fontFamily: "var(--font-serif)",
          }}
        >
          {item.body}
        </div>
        <div style={{ fontSize: 10.5, color: "var(--color-ink-4)", marginTop: 4 }}>
          {formatRelative(item.createdAt)}
        </div>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} onClick={onActivate} style={{ textDecoration: "none" }}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onActivate}
      style={{
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: 0,
        padding: 0,
        font: "inherit",
        color: "inherit",
      }}
    >
      {body}
    </button>
  );
}
