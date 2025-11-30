import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, ChatParticipant, ChatThreadSessionMeta } from '../../shared/services/chatService';

interface ChatWindowProps {
  counterpart: ChatParticipant | null;
  threadTitle?: string | null;
  session?: ChatThreadSessionMeta | null;
  participants?: ChatParticipant[];
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void> | void;
  currentUserId: string | null;
  error?: string | null;
}

const formatMessageTimestamp = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  counterpart,
  threadTitle,
  session,
  participants,
  messages,
  isLoading,
  onSend,
  isSending,
  hasMore,
  onLoadMore,
  currentUserId,
  error,
}) => {
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  const sessionDetails = useMemo(() => {
    if (!session) return '';
    const parts: string[] = [];
    if (session.date) {
      const scheduled = new Date(session.date);
      if (!Number.isNaN(scheduled.getTime())) {
        parts.push(
          new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(scheduled)
        );
      }
    }
    if (session.room) {
      parts.push(session.room);
    }
    return parts.join(' · ');
  }, [session]);

  const participantNameById = useMemo(() => {
    const map = new Map<string, string>();
    participants?.forEach((participant) => {
      if (participant.id) {
        map.set(participant.id, participant.name);
      }
    });
    if (counterpart?.id) {
      map.set(counterpart.id, counterpart.name);
    }
    return map;
  }, [participants, counterpart]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [orderedMessages.length]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    await onSend(trimmed);
    setDraft('');
  };

  return (
    <section className="tw-flex-1 tw-flex tw-flex-col tw-h-full">
      <header className="tw-border-b tw-border-gray-200 tw-p-4">
        <div className="tw-flex tw-flex-col tw-gap-2">
          <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
              {threadTitle || counterpart?.name || 'Select a conversation'}
            </h2>
            {participants?.length ? (
              <span className="tw-text-xs tw-text-gray-500">
                {participants.length} participant{participants.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          {sessionDetails ? (
            <p className="tw-text-xs tw-text-gray-500">{sessionDetails}</p>
          ) : null}
          {participants?.length ? (
            <div className="tw-flex tw-flex-wrap tw-gap-1">
              {participants.slice(0, 4).map((participant) => (
                <span
                  key={participant.id}
                  className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-text-gray-700 tw-text-xs tw-font-medium tw-px-3 tw-py-1"
                >
                  {participant.name}
                </span>
              ))}
              {participants.length > 4 ? (
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-text-gray-600 tw-text-xs tw-font-medium tw-px-3 tw-py-1">
                  +{participants.length - 4} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="tw-flex-1 tw-overflow-y-auto tw-bg-gray-50 tw-p-4 tw-space-y-3">
        {hasMore ? (
          <button
            type="button"
            onClick={() => onLoadMore()}
            className="tw-flex tw-items-center tw-justify-center tw-w-full tw-text-sm tw-text-blue-600 hover:tw-text-blue-700 focus:tw-outline-none"
          >
            Load previous messages
          </button>
        ) : null}

        {isLoading ? (
          <div className="tw-flex tw-justify-center tw-items-center tw-h-24">
            <div className="tw-animate-spin tw-rounded-full tw-h-6 tw-w-6 tw-border-b-2 tw-border-blue-500" role="status" aria-label="Loading messages" />
          </div>
        ) : null}

        {orderedMessages.length === 0 && !isLoading ? (
          <div className="tw-text-center tw-text-sm tw-text-gray-500">No messages yet. Say hello!</div>
        ) : null}

        {orderedMessages.map((message) => {
          const isOwn = currentUserId ? message.senderId === currentUserId : false;
          const senderName = isOwn ? 'You' : participantNameById.get(message.senderId) || 'Participant';
          const timestampLabel = formatMessageTimestamp(message.createdAt);
          return (
            <div key={message.id} className="tw-flex tw-flex-col">
              <div
                className={`tw-inline-block tw-max-w-[75%] tw-rounded-2xl tw-px-4 tw-py-2 tw-text-sm ${
                  isOwn
                    ? 'tw-bg-blue-600 tw-text-white tw-self-end'
                    : 'tw-bg-white tw-text-gray-900 tw-self-start tw-border tw-border-gray-200'
                }`}
              >
                <p className="tw-whitespace-pre-wrap tw-break-words">{message.body}</p>
              </div>
              <span className={`tw-text-[11px] tw-text-gray-500 tw-flex tw-items-center tw-gap-1 ${
                isOwn ? 'tw-self-end tw-pr-2' : 'tw-self-start tw-pl-2'
              }`}>
                {!isOwn ? <span className="tw-font-medium tw-text-gray-600">{senderName}</span> : <span className="tw-text-gray-500">You</span>}
                <span aria-label="Message timestamp">• {timestampLabel}</span>
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error ? (
        <div className="tw-bg-red-50 tw-text-red-600 tw-text-sm tw-px-4 tw-py-2" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="tw-border-t tw-border-gray-200 tw-p-4 tw-bg-white tw-space-y-3">
        <label htmlFor="chat-message" className="tw-sr-only">Type your message</label>
        <textarea
          id="chat-message"
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message…"
          className="tw-w-full tw-resize-none tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
        />
        <div className="tw-flex tw-justify-end">
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium hover:tw-bg-blue-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-ring-offset-2 disabled:tw-opacity-50"
          >
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ChatWindow;
