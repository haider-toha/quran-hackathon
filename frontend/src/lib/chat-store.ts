// Persistent chat-thread store. localStorage key `mishkat:chats:v1`. Threads
// are sorted most-recently-updated first; messages within a thread are kept
// in submission order. Mirrors the toast-store / recents.ts patterns:
// listeners + snapshot for `useSyncExternalStore` consumers.

import { useSyncExternalStore } from "react";

import { isPlainObject } from "@/lib/validators";
import type { Answer, Deferral } from "@/types";

const STORAGE_KEY = "mishkat:chats:v1";
const TITLE_MAX = 60;

// Per-thread render preferences. Phase 7 introduced the synthesized vs.
// by-source toggle on the answer body; the choice persists per-conversation
// so once the user prefers `by-source`, every later answer in the same
// thread defaults to that view. Legacy threads (pre-Phase 7) are migrated
// to the synthesized default at load.
export type AnswerViewMode = "synthesized" | "by-source";

export type ChatThreadPreferences = {
  answerView: AnswerViewMode;
};

const DEFAULT_THREAD_PREFERENCES: ChatThreadPreferences = {
  answerView: "synthesized",
};

const ANSWER_VIEW_VALUES: readonly AnswerViewMode[] = ["synthesized", "by-source"];

export type ChatMessageResult =
  | { kind: "answer"; answer: Answer }
  | { kind: "deferral"; deferral: Deferral };

// A chat thread is a sequence of two message kinds: "exchange" (user
// question + assistant response) and "scope-change" (a system divider
// inserted when the user re-targets the AI mid-conversation). Keeping
// scope-change as a first-class message means the conversation log shows
// exactly which exchanges were grounded to which scope rather than silently
// re-routing every later turn.
export type ChatExchangeMessage = {
  kind: "exchange";
  id: string;
  question: string;
  result: ChatMessageResult;
  timestamp: number;
};

export type ChatScopeChangeMessage = {
  kind: "scope-change";
  id: string;
  scope: string;
  timestamp: number;
};

export type ChatMessage = ChatExchangeMessage | ChatScopeChangeMessage;

export type ChatThread = {
  id: string;
  title: string;
  scope: string;
  messages: readonly ChatMessage[];
  preferences: ChatThreadPreferences;
  createdAt: number;
  updatedAt: number;
};

let threads: readonly ChatThread[] = [];
let snapshot: readonly ChatThread[] = threads;
let initialized = false;

const listeners = new Set<() => void>();
const EMPTY_THREADS: readonly ChatThread[] = Object.freeze([]);

function notify(): void {
  snapshot = threads;
  for (const listener of listeners) listener();
}

function ensureLoaded(): void {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    threads = validate(JSON.parse(raw));
    snapshot = threads;
  } catch {
    threads = [];
    snapshot = threads;
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Quota / privacy mode — ignored, in-memory state still wins for the session.
  }
}

function isResult(value: unknown): value is ChatMessageResult {
  if (!isPlainObject(value)) return false;
  const kind = value.kind;
  if (kind === "answer") return isPlainObject(value.answer);
  if (kind === "deferral") return isPlainObject(value.deferral);
  return false;
}

function isExchangeMessage(value: unknown): value is ChatExchangeMessage {
  if (!isPlainObject(value)) return false;
  return (
    value.kind === "exchange" &&
    typeof value.id === "string" &&
    typeof value.question === "string" &&
    typeof value.timestamp === "number" &&
    Number.isFinite(value.timestamp) &&
    isResult(value.result)
  );
}

function isScopeChangeMessage(value: unknown): value is ChatScopeChangeMessage {
  if (!isPlainObject(value)) return false;
  return (
    value.kind === "scope-change" &&
    typeof value.id === "string" &&
    typeof value.scope === "string" &&
    typeof value.timestamp === "number" &&
    Number.isFinite(value.timestamp)
  );
}

// Legacy exchange row — pre-discriminator threads stored exchanges as
// `{ id, question, result, timestamp }` with no `kind`. Validation accepts
// these and migration lifts them up to the `exchange` shape so callers can
// rely on the discriminated union.
type LegacyExchangeMessage = {
  id: string;
  question: string;
  result: ChatMessageResult;
  timestamp: number;
};

function isLegacyExchange(value: unknown): value is LegacyExchangeMessage {
  if (!isPlainObject(value)) return false;
  return (
    value.kind === undefined &&
    typeof value.id === "string" &&
    typeof value.question === "string" &&
    typeof value.timestamp === "number" &&
    Number.isFinite(value.timestamp) &&
    isResult(value.result)
  );
}

function isLoadableMessage(value: unknown): value is ChatMessage | LegacyExchangeMessage {
  // Accepts both the current discriminated union AND the legacy un-tagged
  // exchange shape. Validation lifts legacy rows in `migrateMessage` so the
  // rest of the app sees a uniform `ChatMessage` union.
  if (isLegacyExchange(value)) return true;
  return isExchangeMessage(value) || isScopeChangeMessage(value);
}

function migrateMessage(value: ChatMessage | LegacyExchangeMessage): ChatMessage {
  // Lift legacy un-discriminated rows up to the `exchange` kind. Any value
  // that already carries a kind passes through untouched.
  if ("kind" in value) return value;
  return {
    kind: "exchange",
    id: value.id,
    question: value.question,
    result: value.result,
    timestamp: value.timestamp,
  };
}

type LoadableThread = Omit<ChatThread, "messages" | "preferences"> & {
  messages: readonly (ChatMessage | LegacyExchangeMessage)[];
  // Legacy threads (pre-Phase 7) won't have `preferences`; we accept any
  // value here and the migration step lifts the answer-view choice up to a
  // valid enum or falls back to the synthesized default.
  preferences?: unknown;
};

function isLoadableThread(value: unknown): value is LoadableThread {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.scope === "string" &&
    Array.isArray(value.messages) &&
    value.messages.every(isLoadableMessage) &&
    typeof value.createdAt === "number" &&
    Number.isFinite(value.createdAt) &&
    typeof value.updatedAt === "number" &&
    Number.isFinite(value.updatedAt)
  );
}

function migratePreferences(value: unknown): ChatThreadPreferences {
  if (!isPlainObject(value)) return DEFAULT_THREAD_PREFERENCES;
  const view = value.answerView;
  if (typeof view === "string" && (ANSWER_VIEW_VALUES as readonly string[]).includes(view)) {
    return { answerView: view as AnswerViewMode };
  }
  return DEFAULT_THREAD_PREFERENCES;
}

function migrateThread(thread: LoadableThread): ChatThread {
  return {
    ...thread,
    messages: thread.messages.map(migrateMessage),
    preferences: migratePreferences(thread.preferences),
  };
}

function validate(input: unknown): readonly ChatThread[] {
  if (!Array.isArray(input)) return [];
  const valid = input.filter(isLoadableThread).map(migrateThread);
  return [...valid].sort((a, b) => b.updatedAt - a.updatedAt);
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveTitle(question: string): string {
  const trimmed = question.trim();
  if (trimmed.length === 0) return "Untitled";
  if (trimmed.length <= TITLE_MAX) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX).trimEnd()}…`;
}

export function subscribeChats(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readChats(): readonly ChatThread[] {
  ensureLoaded();
  return snapshot;
}

export function readEmptyChats(): readonly ChatThread[] {
  return EMPTY_THREADS;
}

export function getThread(id: string): ChatThread | undefined {
  ensureLoaded();
  return threads.find((thread) => thread.id === id);
}

export function createThread(scope: string): ChatThread {
  ensureLoaded();
  const now = Date.now();
  const thread: ChatThread = {
    id: makeId(),
    title: "Untitled",
    scope,
    messages: [],
    preferences: DEFAULT_THREAD_PREFERENCES,
    createdAt: now,
    updatedAt: now,
  };
  threads = [thread, ...threads];
  persist();
  notify();
  return thread;
}

/**
 * Update the per-thread answer-view preference (synthesized vs. by-source).
 * No-op when the thread is missing or the value is unchanged so the slash
 * `/compare` toggle and the segmented control on the answer card don't
 * thrash the store on idle re-renders.
 */
export function setThreadAnswerView(threadId: string, view: AnswerViewMode): void {
  ensureLoaded();
  const target = threads.find((thread) => thread.id === threadId);
  if (!target) return;
  if (target.preferences.answerView === view) return;
  threads = threads.map((thread) =>
    thread.id === threadId
      ? { ...thread, preferences: { ...thread.preferences, answerView: view } }
      : thread,
  );
  persist();
  notify();
}

/**
 * Drop every message in a thread but keep the thread itself (id, scope,
 * preferences). Used by the `/clear` slash command — clearing the
 * conversation lets the user start fresh without losing the side rail's
 * thread entry or the comparative-view preference they've been working with.
 */
export function clearThread(threadId: string): void {
  ensureLoaded();
  const target = threads.find((thread) => thread.id === threadId);
  if (!target) return;
  if (target.messages.length === 0) return;
  threads = threads.map((thread) =>
    thread.id === threadId
      ? { ...thread, messages: [], title: "Untitled", updatedAt: Date.now() }
      : thread,
  );
  persist();
  notify();
}

export function appendMessage(
  threadId: string,
  draft: { question: string; result: ChatMessageResult },
): ChatExchangeMessage | undefined {
  ensureLoaded();
  const target = threads.find((thread) => thread.id === threadId);
  if (!target) return undefined;
  const message: ChatExchangeMessage = {
    kind: "exchange",
    id: makeId(),
    question: draft.question,
    result: draft.result,
    timestamp: Date.now(),
  };
  // Title-from-first-question logic ignores any leading scope-change rows so
  // a user who opens a fresh thread, immediately re-targets the scope, then
  // asks a question still gets a meaningful auto-title.
  const hasExchange = target.messages.some((m) => m.kind === "exchange");
  const updated: ChatThread = {
    ...target,
    title: hasExchange ? target.title : deriveTitle(message.question),
    messages: [...target.messages, message],
    updatedAt: message.timestamp,
  };
  threads = [updated, ...threads.filter((thread) => thread.id !== threadId)];
  persist();
  notify();
  return message;
}

export function appendScopeChange(
  threadId: string,
  scope: string,
): ChatScopeChangeMessage | undefined {
  ensureLoaded();
  const target = threads.find((thread) => thread.id === threadId);
  if (!target) return undefined;
  // A repeated scope-change to the same value is a no-op — the conversation
  // log should not collect divider noise from idle re-renders.
  const last = target.messages[target.messages.length - 1];
  if (last && last.kind === "scope-change" && last.scope === scope) return undefined;
  const message: ChatScopeChangeMessage = {
    kind: "scope-change",
    id: makeId(),
    scope,
    timestamp: Date.now(),
  };
  const updated: ChatThread = {
    ...target,
    scope,
    messages: [...target.messages, message],
    updatedAt: message.timestamp,
  };
  threads = [updated, ...threads.filter((thread) => thread.id !== threadId)];
  persist();
  notify();
  return message;
}

export function deleteThread(id: string): void {
  ensureLoaded();
  const before = threads.length;
  threads = threads.filter((thread) => thread.id !== id);
  if (threads.length === before) return;
  persist();
  notify();
}

export function renameThread(id: string, title: string): void {
  ensureLoaded();
  const trimmed = title.trim();
  if (trimmed.length === 0) return;
  const target = threads.find((thread) => thread.id === id);
  if (!target || target.title === trimmed) return;
  threads = threads.map((thread) =>
    thread.id === id ? { ...thread, title: trimmed, updatedAt: Date.now() } : thread,
  );
  persist();
  notify();
}

export function useChats(): readonly ChatThread[] {
  return useSyncExternalStore(subscribeChats, readChats, readEmptyChats);
}

export function useThread(id: string | null): ChatThread | undefined {
  const all = useChats();
  if (id === null) return undefined;
  return all.find((thread) => thread.id === id);
}
