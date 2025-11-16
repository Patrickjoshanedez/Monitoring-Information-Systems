import { useEffect } from 'react';
import { getPusherClient } from '../config/pusherClient';
import type { NotificationRealtimePayload } from '../services/notificationService';

export type NotificationSocketOptions = {
  userId?: string | null;
  enabled?: boolean;
  onNotification?: (payload: NotificationRealtimePayload) => void;
};

export const useNotificationSocket = ({ userId, enabled = true, onNotification }: NotificationSocketOptions) => {
  useEffect(() => {
    if (!enabled || !userId) {
      return undefined;
    }

    const client = getPusherClient();
    if (!client) {
      return undefined;
    }

    const channelName = `private-user-${userId}`;
    const channel = client.subscribe(channelName);
    const handler = (payload: NotificationRealtimePayload) => {
      onNotification?.(payload);
    };

    channel.bind('notification:new', handler);

    return () => {
      channel.unbind('notification:new', handler);
      client.unsubscribe(channelName);
    };
  }, [userId, enabled, onNotification]);
};

export default useNotificationSocket;
