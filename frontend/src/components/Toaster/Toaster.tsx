"use client";

// Toaster — bottom-center stack of ephemeral micro-feedback messages
// ("Copied", "Saved", "Couldn't copy"). Subscribes to `toast-store` via the
// `useToasts` hook and renders into a portal so the stack floats above any
// dialog or overlay. The store handles lifecycle (auto-dismiss + the
// two-phase exiting flag); this component just renders the snapshot.
//
// Animations: entrance is `toastIn` (slide up + fade); exit is `toastOut`
// (fade + tiny drop) triggered when `toast.exiting` flips. Both live in
// globals.css under the toaster section.
//
// The Library page suppresses the entire stack — that surface is meant to
// be a calm archive, not a place where system noise surfaces. Toasts
// triggered while the user is on /library are dropped on the floor.
//
// Phase 6 — error-variant toasts are dropped on `/journal*` routes so a
// "Couldn't copy"-style alert doesn't break the writing flow. Success and
// info toasts still render there (e.g. "Saved" remains useful feedback).
// Today this acts as the project's stand-in for the spec's "1 Issue" toast:
// a future error banner would surface through the same toast pipeline, so
// gating error variants here covers both today's and tomorrow's noise.

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { AlertInfoIcon, AlertWarnIcon, CheckIcon, XIcon } from "@/components/Icon";
import { dismissToast } from "@/lib/toast-store";
import type { Toast, ToastVariant } from "@/lib/toast-store";

import { useToasts } from "@/hooks/useToast";

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") return <CheckIcon size={13} />;
  if (variant === "error") return <AlertWarnIcon size={13} />;
  return <AlertInfoIcon size={13} />;
}

// Returns `true` only after client hydration. SSR snapshot is `false`, so the
// portal call is gated until `document.body` exists. Mirrors the
// `useHydrated` helper in Reader.tsx — same project convention.
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function Toaster() {
  const toasts = useToasts();
  const hydrated = useHydrated();
  const pathname = usePathname();

  if (!hydrated) return null;
  if (toasts.length === 0) return null;
  // Library page is a quiet surface — drop system chrome here.
  if (pathname?.startsWith("/library")) return null;

  // Journal compose / connect routes get error variants suppressed —
  // success and info still render so save feedback ("Saved") survives,
  // but failure-variant toasts (a future "1 Issue" banner included)
  // don't pop.
  const onJournal = pathname?.startsWith("/journal") ?? false;
  const visibleToasts = onJournal ? toasts.filter((t) => t.variant !== "error") : toasts;
  if (visibleToasts.length === 0) return null;

  return createPortal(
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {visibleToasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}

function ToastRow({ toast }: { toast: Toast }) {
  return (
    <div
      className={`toast toast--${toast.variant}${toast.exiting ? "toast--exiting" : ""}`}
      role={toast.variant === "error" ? "alert" : "status"}
    >
      <span className="toast-icon" aria-hidden="true">
        <VariantIcon variant={toast.variant} />
      </span>
      <span className="toast-msg">{toast.message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
      >
        <XIcon size={11} />
      </button>
    </div>
  );
}
