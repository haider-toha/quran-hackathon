// Pure runtime narrowing helpers shared across the storage adapters.
// localStorage / sessionStorage / structuredClone produce values typed as
// `unknown`, and we want a single, unambiguous spot to narrow them. Keep
// this module React-free so it can be imported anywhere.

/**
 * Narrow a value to a plain (non-array, non-null) object. Useful as the
 * first gate when validating JSON pulled from storage where we trust nothing
 * about the shape.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type-safe enum picker. Returns `value` when it appears in `allowed`,
 * otherwise `fallback`. Cast happens inside the helper on the
 * `(allowed as readonly unknown[]).includes(value)` side so the return path
 * stays free of `as T` — the type guard flows out as `T`.
 */
export function pick<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

/**
 * `value is readonly string[]` guard for arrays of strings. Used by stores
 * that round-trip arrays through `JSON.parse`.
 */
export function isReadonlyStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}
