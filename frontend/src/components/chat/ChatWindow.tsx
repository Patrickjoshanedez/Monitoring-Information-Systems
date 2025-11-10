import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, ChatParticipant } from '../../shared/services/chatService';

interface ChatWindowProps {
  counterpart: ChatParticipant | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void> | void;
  currentUserId: string | null;
  error?: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  counterpart,
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
        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
          {counterpart?.name || 'Select a conversation'}
        </h2>
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
              <span className={`tw-text-xs tw-text-gray-400 ${isOwn ? 'tw-self-end tw-pr-2' : 'tw-self-start tw-pl-2'}`}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
