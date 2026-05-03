// Recent searches store. localStorage key `mishkat:recents:v1`. Most-recent
// first, deduped on `query` (case-insensitive), capped at MAX entries. Read
// returns a snapshot so callers can pass it to React safely.

import { isPlainObject } from "@/lib/validators";
import type { AppRoute } from "@/types";

const STORAGE_KEY = "mishkat:recents:v1";
const MAX = 5;

const ROUTES: readonly AppRoute[] = ["/", "/ask", "/journal", "/library", "/research", "/settings"];

export type RecentSearch = {
  id: string;
  query: string;
  route: AppRoute;
  timestamp: number;
};

function isAppRoute(value: unknown): value is AppRoute {
  return typeof value === "string" && (ROUTES as readonly string[]).includes(value);
}

function isRecentSearch(value: unknown): value is RecentSearch {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.query === "string" &&
    isAppRoute(value.route) &&
    typeof value.timestamp === "number" &&
    Number.isFinite(value.timestamp)
  );
}

function validate(input: unknown): RecentSearch[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isRecentSearch);
}

export function readRecents(): readonly RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return validate(JSON.parse(raw));
  } catch {
    return [];
  }
}

function write(list: readonly RecentSearch[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Quota / privacy mode.
  }
}

function makeId(): string {
  // crypto.randomUUID is available in all browsers we target; fall back to
  // a timestamp-based id only if it's missing (older WebViews).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addRecent(query: string, route: AppRoute): void {
  const trimmed = query.trim();
  if (trimmed.length === 0) return;
  const existing = readRecents();
  const lower = trimmed.toLowerCase();
  const deduped = existing.filter((r) => r.query.trim().toLowerCase() !== lower);
  const next: RecentSearch[] = [
    { id: makeId(), query: trimmed, route, timestamp: Date.now() },
    ...deduped,
  ].slice(0, MAX);
  write(next);
}

export function clearRecents(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
