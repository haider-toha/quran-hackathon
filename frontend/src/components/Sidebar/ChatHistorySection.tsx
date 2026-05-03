"use client";

// ChatHistorySection — chat history folded into the main left rail. Lives
// below the primary nav. Conversations are grouped by **scope** (e.g.
// "Ad-Duha 93:1–11") not by date — the principle is "research tool, not
// chatbot". Within each group, threads are sorted by most-recent updatedAt.
//
// The section is collapsible to save vertical space; default is open.
// Active thread is reflected via `?thread=<id>` on the URL.

import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type MouseEvent } from "react";

import { ChevronRightIcon, XIcon } from "@/components/Icon";
import { deleteThread, useChats, type ChatThread } from "@/lib/chat-store";
import { showToast } from "@/lib/toast-store";

type Group = {
  scope: string;
  threads: readonly ChatThread[];
};

const NO_SCOPE = "Other conversations";

function groupByScope(threads: readonly ChatThread[]): readonly Group[] {
  if (threads.length === 0) return [];
  // Preserve scope-first-seen order so repeated groupings don't shuffle the
  // sidebar between renders. Within each group, the source `threads` array is
  // already sorted most-recent-first by the chat-store, so the slice's order
  // is naturally what we want.
  const order: string[] = [];
  const buckets = new Map<string, ChatThread[]>();
  for (const thread of threads) {
    const key = thread.scope.trim().length > 0 ? thread.scope : NO_SCOPE;
    if (!buckets.has(key)) {
      order.push(key);
      buckets.set(key, []);
    }
    buckets.get(key)?.push(thread);
  }
  return order.map((scope) => ({
    scope,
    threads: (buckets.get(scope) ?? []).slice().sort((a, b) => b.updatedAt - a.updatedAt),
  }));
}

export function ChatHistorySection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams?.get("thread") ?? null;
  const [open, setOpen] = useState(true);
  const threads = useChats();
  const groups = useMemo(() => groupByScope(threads), [threads]);

  const handleSelect = useCallback(
    (id: string) => {
      if (id === activeId) return;
      router.push(`/ask?thread=${id}`);
    },
    [router, activeId],
  );

  const handleDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>, id: string) => {
      event.stopPropagation();
      event.preventDefault();
      deleteThread(id);
      if (activeId === id) router.push("/ask");
      showToast("Chat deleted");
    },
    [router, activeId],
  );

  return (
    <section className="chat-history-section" aria-label="Chat history">
      <button
        type="button"
        className="chat-history-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <ChevronRightIcon size={11} style={{ transform: open ? "rotate(90deg)" : "none" }} />
        <span className="chat-history-toggle-label">Chats</span>
        {threads.length > 0 ? (
          <span className="chat-history-toggle-count">{threads.length}</span>
        ) : null}
      </button>
      {open ? (
        <div className="chat-history-body">
          {threads.length === 0 ? (
            <p className="chat-history-empty">
              No conversations yet. Start one with the New chat button above.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.scope} className="chat-history-group">
                <div className="chat-history-group-label" title={group.scope}>
                  {group.scope}
                </div>
                <ul className="chat-history-list">
                  {group.threads.map((thread) => (
                    <ThreadItem
                      key={thread.id}
                      thread={thread}
                      active={thread.id === activeId}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}

type ItemProps = {
  thread: ChatThread;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (event: MouseEvent<HTMLButtonElement>, id: string) => void;
};

function ThreadItem({ thread, active, onSelect, onDelete }: ItemProps) {
  return (
    <li className={clsx("chat-history-item", active && "active")}>
      <button
        type="button"
        className="chat-history-item-btn"
        onClick={() => onSelect(thread.id)}
        aria-current={active ? "page" : undefined}
        title={thread.title}
      >
        <span className="chat-history-item-title">{thread.title}</span>
      </button>
      <button
        type="button"
        className="chat-history-item-delete"
        onClick={(event) => onDelete(event, thread.id)}
        aria-label={`Delete chat: ${thread.title}`}
      >
        <XIcon size={10} />
      </button>
    </li>
  );
}
