"use client";

import { useSyncExternalStore } from "react";

import {
  readEmptyToasts,
  readToasts,
  subscribeToasts,
  type Toast,
} from "@/lib/toast-store";

// Subscribe to the toast store via React's external-store hook. SSR returns
// the frozen-empty snapshot so the server render emits no markup; the client
// snapshot picks up immediately on hydration.
export function useToasts(): readonly Toast[] {
  return useSyncExternalStore(subscribeToasts, readToasts, readEmptyToasts);
}
