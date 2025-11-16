import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ChatThreadList from '../components/chat/ChatThreadList';
import ChatWindow from '../components/chat/ChatWindow';
import { useChatThreads } from '../shared/hooks/useChatThreads';
import { useChatMessages } from '../shared/hooks/useChatMessages';
import {
  CHAT_THREADS_QUERY_KEY,
  chatMessagesQueryKey,
  markThreadRead,
  sendMessage,
  type ChatMessage,
} from '../shared/services/chatService';

interface ApiError {
  message?: string;
  error?: string;
}

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const ChatPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { threads, isLoading, error, startConversation } = useChatThreads();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useMemo(() => readStoredUser(), []);
  const currentUserId: string | null = user?._id || user?.id || null;

  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const requestedThreadId = searchParams.get('threadId');
    if (requestedThreadId && threads.some((thread) => thread.id === requestedThreadId)) {
      setActiveThreadId(requestedThreadId);
      const nextParams = new URLSearchParams(searchParamsString);
      nextParams.delete('threadId');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId, searchParams, searchParamsString, setSearchParams]);

  const activeThread = useMemo(() => {
    if (!activeThreadId) return null;
    return threads.find((thread) => thread.id === activeThreadId) ?? null;
  }, [threads, activeThreadId]);

  const messagesQuery = useChatMessages(activeThreadId);

  const messages = useMemo(() => {
    if (!messagesQuery.data) {
      return [];
    }
    return messagesQuery.data.pages.flatMap((page) => page.messages);
  }, [messagesQuery.data]);

  const markReadMutation = useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: markThreadRead,
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: chatMessagesQueryKey(threadId) });
    },
  });

  useEffect(() => {
    if (!activeThreadId || messages.length === 0 || !currentUserId) {
      return;
    }
    const latestMessage = messages[messages.length - 1];
    if (latestMessage.senderId !== currentUserId) {
      markReadMutation.mutate(activeThreadId);
    }
  }, [activeThreadId, messages, currentUserId, markReadMutation]);

  const sendMessageMutation = useMutation<ChatMessage, AxiosError<ApiError>, { threadId: string; body: string }>({
    mutationFn: ({ threadId, body }) => sendMessage(threadId, body),
    onMutate: () => {
      setSendError(null);
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: chatMessagesQueryKey(message.threadId) });
      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    },
    onError: (err: AxiosError<ApiError>) => {
      const customMessage = err.response?.data?.message ?? 'Failed to send message.';
      setSendError(customMessage);
    },
  });

  const handleSendMessage = async (body: string) => {
    if (!activeThreadId) {
      setSendError('Select a conversation first.');
      return;
    }
    await sendMessageMutation.mutateAsync({ threadId: activeThreadId, body });
  };

  const handleStartConversation = async (email: string) => {
    try {
      setCreationError(null);
      const thread = await startConversation.mutateAsync({ participantEmail: email });
      if (thread?.id) {
        setActiveThreadId(thread.id);
        queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const message = axiosError.response?.data?.message ?? 'Unable to start conversation.';
      setCreationError(message);
      throw err;
    }
  };

  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-flex tw-flex-col lg:tw-flex-row tw-gap-6 tw-min-h-[70vh]">
        <ChatThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          onSelect={setActiveThreadId}
          onStartConversation={handleStartConversation}
          isCreating={startConversation.isLoading}
          errorMessage={creationError}
          isLoading={isLoading}
        />

        <div className="tw-flex-1 tw-min-h-[400px] tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-200 tw-flex tw-flex-col">
          {error ? (
            <div className="tw-flex tw-items-center tw-justify-center tw-flex-1 tw-text-red-600 tw-text-sm tw-p-6">
              Failed to load conversations.
            </div>
          ) : null}

          {!activeThread ? (
            <div className="tw-flex tw-items-center tw-justify-center tw-flex-1 tw-text-sm tw-text-gray-500">
              Select a conversation or start a new one to begin chatting.
            </div>
          ) : (
            <ChatWindow
              counterpart={activeThread.counterpart}
              threadTitle={activeThread.title}
              participants={activeThread.participants}
              session={activeThread.session}
              messages={messages}
              isLoading={messagesQuery.isLoading && !messagesQuery.isFetchingNextPage}
              onSend={handleSendMessage}
              isSending={sendMessageMutation.isLoading}
              hasMore={Boolean(messagesQuery.hasNextPage)}
              onLoadMore={async () => {
                await messagesQuery.fetchNextPage();
              }}
              currentUserId={currentUserId}
              error={sendError}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
