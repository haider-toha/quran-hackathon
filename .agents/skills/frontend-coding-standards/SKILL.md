---
name: frontend-coding-standards
description: Frontend rules for Quran Hackathon — Next.js 16 App Router, React 19, TS strict, Tailwind v4. Use when editing anything under `frontend/src/`.
---

# Frontend Coding Standards

## Stack

- Next.js 16 App Router (Turbopack default; `params`/`searchParams` are `Promise`)
- React 19 (native form actions, `useActionState`, refs as props)
- TypeScript `strict: true`
- Tailwind v4 (no JS config; tokens via CSS `@theme`; OKLCH default palette)
- pnpm

## Directory layout

```
src/
  app/          Routes: page.tsx, layout.tsx, loading.tsx, error.tsx, route.ts
  components/   Shared UI, one folder per component (Button/Button.tsx, index.ts)
  hooks/        Client-only hooks ("use client")
  lib/          Pure utilities + API clients (no React)
  types/        Shared TS types
```

Public exports through `index.ts`. Split components > 300 lines (mandatory > 500). `page.tsx` / `layout.tsx` stay thin.

## Hard rules

| Rule | Why |
|---|---|
| Default to Server Components; `"use client"` only for state/effects/events/refs/browser APIs | RSC is the default rendering model |
| Push `"use client"` to the leaf, not the route root | Avoids dragging whole pages into the bundle |
| Fetch data in RSCs or Server Actions — never `useEffect` | No cache, no dedup, race conditions |
| `await params` / `await searchParams` in pages, layouts, route handlers, OG/sitemap fns | Next.js 16 makes them `Promise` |
| `next/image` always; never `<img>` | Loses optimization + CLS guards |
| `next/link` for internal nav; never `<a href="/...">` | Skips client routing + prefetch |
| Type props explicitly; never `React.FC` | Implicit `children` and quirks |
| Never `any`; prefer `unknown` + narrowing | Loses every guarantee from `strict` |
| No `@ts-ignore` (use `@ts-expect-error` with reason if unavoidable) | Rots silently |
| Mutating Server Actions must `revalidatePath` / `revalidateTag` | Stale cached pages |
| Validate every Server Action input with Zod | Client input is hostile |
| No raw color utilities (`text-gray-600`); use `@theme` semantic tokens | Breaks dark mode + drifts |
| No LLM provider SDKs anywhere in `frontend/src/**` — proxy through the FastAPI backend | Frontend has no API key; key would leak |
| Only `NEXT_PUBLIC_*` env vars are safe in client code | Anything else leaks into the bundle |

## Server Component fetching

```tsx
// src/app/verses/[surah]/page.tsx
import { fetchSurah } from "@/lib/api/quran";
import { VerseList } from "@/components/VerseList";

export default async function SurahPage({
  params,
}: {
  params: Promise<{ surah: string }>;
}) {
  const { surah } = await params;
  const data = await fetchSurah(Number(surah));
  return <VerseList surah={data} />;
}
```

## Server Action + form (React 19 native)

```ts
// src/app/notes/actions.ts
"use server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createNote } from "@/lib/api/notes";

const NoteInput = z.object({ text: z.string().trim().min(1).max(2000) });
type ActionState = { ok: true } | { ok: false; error: string } | null;

export async function addNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = NoteInput.safeParse({ text: formData.get("text") });
  if (!parsed.success) return { ok: false, error: "Note text required" };
  await createNote(parsed.data);
  revalidateTag("notes");
  return { ok: true };
}
```

```tsx
// src/app/notes/NoteForm.tsx
"use client";
import { useActionState } from "react";
import { addNoteAction } from "./actions";

export function NoteForm() {
  const [state, action, pending] = useActionState(addNoteAction, null);
  return (
    <form action={action} className="flex gap-2">
      <input name="text" required className="rounded-md border border-border bg-background px-3 py-2" />
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
        {pending ? "Saving…" : "Save"}
      </button>
      {state && !state.ok ? <p role="alert" className="text-destructive">{state.error}</p> : null}
    </form>
  );
}
```

Reach for `react-hook-form` + `zodResolver` only for cross-field validation, async checks, or fine-grained dirty/touched state.

## Client component with state

```tsx
"use client";
import { useState, useTransition } from "react";

export function VerseSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <input
      value={q}
      onChange={(e) => { setQ(e.target.value); startTransition(() => onSearch(e.target.value)); }}
      aria-busy={pending}
      className="w-full rounded-md border border-border bg-background px-3 py-2"
    />
  );
}
```

## Tailwind v4 — `@theme` tokens

`@theme` defines CSS variables **and** generates utilities (`--color-foo` → `bg-foo`, `text-foo`, `border-foo`).

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(20% 0.02 270);
  --color-muted: oklch(96% 0.01 270);
  --color-primary: oklch(20% 0.02 270);
  --color-primary-foreground: oklch(98% 0 0);
  --color-border: oklch(91% 0.01 270);
  --color-destructive: oklch(58% 0.2 25);
  --font-arabic: "KFGQPC Uthmanic Script HAFS", "Amiri Quran", serif;
}
```

If a token is missing, **add it to `@theme`** rather than reach for a raw color. Use opacity modifiers (`text-foreground/80`).

## Accessibility checklist

- Native semantics (`button`, `a`, `label`, `table`) before ARIA.
- Visible `:focus-visible` ring; never `outline: none` without a replacement.
- Hit targets ≥24px desktop, ≥44px mobile; `<input>` font-size ≥16px on mobile (prevents iOS zoom).
- Icon-only buttons need `aria-label`; decorative images get `alt=""` or `aria-hidden`.
- `aria-live="polite"` for toasts and inline validation; skeletons mirror final layout (no CLS).

## Anti-patterns

- `useEffect` for data fetching
- Sync access to `params` / `searchParams`
- `<img>`, `<a>` for internal nav, `React.FC`, `as any`
- `key={index}` on lists that reorder/filter/insert
- Passing functions / non-serializable values from Server → Client Component
- Context provider whose `value` is a fresh object literal every render (wrap in `useMemo`)
- Mutation Server Action without a corresponding `revalidate*` call
- Inline raw color utilities (`text-gray-600`) instead of `@theme` tokens
- Secrets in any `NEXT_PUBLIC_*` env var
- LLM SDK imports anywhere under `frontend/src/**`
