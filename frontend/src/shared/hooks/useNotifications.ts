import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  MatchNotification,
} from '../services/mentorMatching';

const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export type UseNotificationsResult = {
  notifications: MatchNotification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => Promise<unknown>;
  markAllRead: () => Promise<unknown>;
};

export const useNotifications = (): UseNotificationsResult => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    refetchInterval: 60 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  }, [queryClient]);

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });

  const markRead = useCallback(
    async (id: string) => {
      const result = await readMutation.mutateAsync(id);
      return result;
    },
    [readMutation]
  );

  const markAllRead = useCallback(async () => {
    const result = await readAllMutation.mutateAsync();
    return result;
  }, [readAllMutation]);

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markRead,
    markAllRead,
  };
};

export default useNotifications;
