import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  CHAT_THREADS_QUERY_KEY,
  ChatThread,
  CreateThreadPayload,
  ListThreadsResponse,
  createThread,
  listThreads,
} from '../services/chatService';

export const useChatThreads = () => {
  const queryClient = useQueryClient();

  const threadsQuery = useQuery<ListThreadsResponse, AxiosError>({
    queryKey: CHAT_THREADS_QUERY_KEY,
    queryFn: () => listThreads({ includeArchived: true }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const startConversation = useMutation<ChatThread, AxiosError, CreateThreadPayload>({
    mutationFn: (payload) => createThread(payload),
    onSuccess: (thread) => {
      queryClient.setQueryData<ListThreadsResponse | undefined>(CHAT_THREADS_QUERY_KEY, (current) => {
        if (!current) {
          return { threads: [thread], count: 1 };
        }
        const exists = current.threads.some((item) => item.id === thread.id);
        const threads = exists
          ? current.threads.map((item) => (item.id === thread.id ? thread : item))
          : [thread, ...current.threads];
        return {
          threads,
          count: threads.length,
        };
      });
    },
  });

  return {
    threads: threadsQuery.data?.threads ?? [],
    count: threadsQuery.data?.count ?? 0,
    isLoading: threadsQuery.isLoading,
    isFetching: threadsQuery.isFetching,
    error: threadsQuery.error,
    refetch: threadsQuery.refetch,
    startConversation,
  };
};
