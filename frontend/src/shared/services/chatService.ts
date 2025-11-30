import { apiClient } from '../config/apiClient';

export const CHAT_THREADS_QUERY_KEY = ['chat', 'threads'] as const;
export const chatMessagesQueryKey = (threadId: string) => ['chat', 'threads', threadId, 'messages'] as const;

export interface ChatParticipant {
  id: string;
  name: string;
  avatar: string | null;
  role?: string;
}

export interface ChatThreadSessionMeta {
  id: string | null;
  subject: string | null;
  date: string | null;
  room: string | null;
}

export interface ChatThread {
  id: string;
  type: 'direct' | 'session';
  title: string;
  mentor: ChatParticipant | null;
  mentee: ChatParticipant | null;
  counterpart: ChatParticipant | null;
  participants: ChatParticipant[];
  session: ChatThreadSessionMeta | null;
  lastMessage: string | null;
  lastMessageAt: string | Date | null;
  lastSender: string | null;
  unreadCount: number;
  archived: boolean;
}

export interface ListThreadsResponse {
  threads: ChatThread[];
  count: number;
}

export interface ListThreadsOptions {
  includeArchived?: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export interface ListMessagesResponse {
  messages: ChatMessage[];
  cursor: string | null;
  limit: number;
}

export interface CreateThreadPayload {
  participantId?: string;
  participantEmail?: string;
}

export const listThreads = async (options: ListThreadsOptions = {}): Promise<ListThreadsResponse> => {
  const params: Record<string, unknown> = {};
  if (options.includeArchived) {
    params.includeArchived = true;
  }
  const { data } = await apiClient.get('/chat/threads', { params });
  const threads: ChatThread[] = data?.threads ?? [];
  const count = data?.meta?.count ?? threads.length;
  return { threads, count };
};

export const createThread = async (payload: CreateThreadPayload): Promise<ChatThread> => {
  const { data } = await apiClient.post('/chat/threads', payload);
  return data?.thread;
};

export const listMessages = async (
  threadId: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<ListMessagesResponse> => {
  const { data } = await apiClient.get(`/chat/threads/${threadId}/messages`, { params });
  return {
    messages: data?.messages ?? [],
    cursor: data?.meta?.cursor ?? null,
    limit: data?.meta?.limit ?? (params.limit ?? 50),
  };
};

export const sendMessage = async (threadId: string, body: string): Promise<ChatMessage> => {
  const { data } = await apiClient.post(`/chat/threads/${threadId}/messages`, { body });
  return data?.message;
};

export const markThreadRead = async (threadId: string): Promise<void> => {
  await apiClient.post(`/chat/threads/${threadId}/read`);
};

export const archiveThread = async (threadId: string): Promise<void> => {
  await apiClient.post(`/chat/threads/${threadId}/archive`);
};

export const unarchiveThread = async (threadId: string): Promise<void> => {
  await apiClient.post(`/chat/threads/${threadId}/unarchive`);
};

export const deleteThread = async (threadId: string): Promise<void> => {
  await apiClient.delete(`/chat/threads/${threadId}`);
};
