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

  if (!hydrated) return null;
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}

function ToastRow({ toast }: { toast: Toast }) {
  return (
    <div
      className={`toast toast--${toast.variant}${toast.exiting ? " toast--exiting" : ""}`}
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
