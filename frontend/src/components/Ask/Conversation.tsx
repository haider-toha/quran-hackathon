"use client";

// Conversation — renders the persisted message log for the active chat
// thread. Two message kinds:
//   - "exchange": question + AnsweredView/LowConfidenceView
//   - "scope-change": a centered hairline divider explaining that the AI
//     was re-targeted mid-conversation. We don't silently re-route — every
//     scope change leaves a visible mark in the log.

import type { ChatExchangeMessage, ChatScopeChangeMessage, ChatThread } from "@/lib/chat-store";

import { AnsweredView } from "./AnsweredView";
import { LowConfidenceView } from "./LowConfidenceView";

type Props = {
  thread: ChatThread | undefined;
};

export function Conversation({ thread }: Props) {
  if (!thread || thread.messages.length === 0) return null;
  const threadId = thread.id;
  return (
    <div className="conversation">
      {thread.messages.map((message) => {
        if (message.kind === "scope-change") {
          return <ScopeChangeDivider key={message.id} message={message} />;
        }
        return <Exchange key={message.id} message={message} threadId={threadId} />;
      })}
    </div>
  );
}

function Exchange({ message, threadId }: { message: ChatExchangeMessage; threadId: string }) {
  return (
    <div className="conversation-exchange">
      <div className="answer">
        <span className="q-label">You asked</span>
        <div className="q-text">{message.question}</div>
      </div>
      {message.result.kind === "answer" ? (
        <AnsweredView answer={message.result.answer} threadId={threadId} />
      ) : (
        <LowConfidenceView deferral={message.result.deferral} />
      )}
    </div>
  );
}

function ScopeChangeDivider({ message }: { message: ChatScopeChangeMessage }) {
  return (
    <div className="conversation-scope-divider" role="separator">
      <span className="conversation-scope-divider-text">Scope changed to {message.scope}</span>
    </div>
  );
}
