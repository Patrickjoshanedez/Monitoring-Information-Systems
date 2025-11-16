import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  mapRealtimeNotification,
  type NotificationItem,
  type NotificationListMeta,
  type NotificationListResponse,
  type NotificationMutationResult,
  type NotificationQueryParams,
  type NotificationRealtimePayload,
} from '../services/notificationService';
import { useNotificationSocket } from './useNotificationSocket';

const NOTIFICATIONS_QUERY_KEY = 'notifications';

type UseNotificationsOptions = NotificationQueryParams & {
  subscribe?: boolean;
  enabled?: boolean;
};

export type UseNotificationsResult = {
  notifications: NotificationItem[];
  unreadCount: number;
  meta: NotificationListMeta | null;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => Promise<NotificationListResponse | undefined>;
  markRead: (id: string) => Promise<NotificationMutationResult>;
  markAllRead: () => Promise<NotificationMutationResult>;
  isMarkingRead: boolean;
  isMarkingAll: boolean;
};

const DEFAULT_LIMIT = 50;

const readStoredUserId = (): string | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?._id || parsed?.id || parsed?.userId || null;
  } catch {
    return null;
  }
};

const createEmptyResponse = (limit: number): NotificationListResponse => ({
  notifications: [],
  unreadCount: 0,
  meta: {
    cursor: null,
    limit,
    count: 0,
    usingCursor: false,
  },
});

const buildQueryKey = (params: { type?: string; limit?: number }) =>
  [NOTIFICATIONS_QUERY_KEY, params.type ?? 'all', params.limit ?? DEFAULT_LIMIT] as const;

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsResult => {
  const limit = useMemo(() => Math.min(100, Math.max(1, options.limit ?? DEFAULT_LIMIT)), [options.limit]);
  const params = useMemo<NotificationQueryParams>(() => ({
    limit,
    type: options.type,
  }), [limit, options.type]);

  const queryKey = useMemo(() => buildQueryKey(params), [params]);

  const queryClient = useQueryClient();

  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;
  const queryEnabled = (options.enabled ?? true) && hasToken;

  const query = useQuery(queryKey, () => fetchNotifications(params), {
    enabled: queryEnabled,
    staleTime: 30_000,
    cacheTime: 5 * 60_000,
  });

  const updateCache = useCallback(
    (updater: (current: NotificationListResponse) => NotificationListResponse) => {
      queryClient.setQueryData<NotificationListResponse | undefined>(queryKey, (prev) => {
        const base = prev ?? createEmptyResponse(limit);
        return updater(base);
      });
    },
    [queryClient, queryKey, limit]
  );

  const handleRealtime = useCallback(
    (payload: NotificationRealtimePayload) => {
      const incoming = mapRealtimeNotification(payload);
      updateCache((current) => {
        const withoutDuplicate = current.notifications.filter((item) => item.id !== incoming.id);
        const nextList = [incoming, ...withoutDuplicate].slice(0, limit);
        const unreadIncrement = withoutDuplicate.length === current.notifications.length ? 1 : 0;
        return {
          ...current,
          notifications: nextList,
          unreadCount: current.unreadCount + unreadIncrement,
          meta: {
            ...current.meta,
            count: nextList.length,
            limit,
          },
        };
      });
    },
    [limit, updateCache]
  );

  const userId = useMemo(() => readStoredUserId(), []);

  useNotificationSocket({
    userId,
    enabled: options.subscribe !== false && !!userId,
    onNotification: handleRealtime,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: (result, id) => {
      updateCache((current) => {
        const notifications = current.notifications.map((notification) =>
          notification.id === id
            ? { ...notification, readAt: result.notification?.readAt ?? new Date().toISOString() }
            : notification
        );
        const wasUnread = current.notifications.some((notification) => notification.id === id && !notification.readAt);
        const unreadDelta = wasUnread ? -1 : 0;
        return {
          ...current,
          notifications,
          unreadCount: Math.max(0, current.unreadCount + unreadDelta),
        };
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      updateCache((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    },
  });

  const markRead = useCallback(
    async (id: string) => markReadMutation.mutateAsync(id),
    [markReadMutation]
  );

  const markAllRead = useCallback(
    async () => markAllMutation.mutateAsync(),
    [markAllMutation]
  );

  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;
  const meta = query.data?.meta ?? null;

  const refetchData = useCallback(async () => {
    const result = await query.refetch();
    return result.data;
  }, [query]);

  return {
    notifications,
    unreadCount,
    meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: refetchData,
    markRead,
    markAllRead,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAll: markAllMutation.isPending,
  };
};

export default useNotifications;
