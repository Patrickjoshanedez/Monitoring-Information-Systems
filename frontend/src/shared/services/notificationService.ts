import logger from '../utils/logger';
import { apiClient } from '../config/apiClient';

export type NotificationCategory = 'session' | 'message' | 'announcement' | 'system';
export type NotificationTypeFilter = NotificationCategory;

const TYPE_FILTER_PREFIXES: Record<NotificationCategory, string[]> = {
  session: ['SESSION_', 'SCHEDULE_', 'REMINDER_', 'MENTORSHIP_'],
  message: ['MESSAGE_', 'CHAT_'],
  announcement: ['ANNOUNCEMENT_', 'ADMIN_', 'BULLETIN_'],
  system: ['SYSTEM_', 'APP_', 'PROFILE_', 'APPLICATION_', 'GOAL_', 'CERT_', 'PROGRESS_'],
};

const REMINDER_HOUR_TO_MINUTES = new Map<number, number>([
  [48, 2880],
  [24, 1440],
  [1, 60],
]);

const REMINDER_MINUTES_TO_HOURS = new Map<number, number>([
  [2880, 48],
  [1440, 24],
  [60, 1],
]);

const DEFAULT_REMINDER_MINUTES = Array.from(REMINDER_HOUR_TO_MINUTES.values());
const DEFAULT_REMINDER_HOURS = Array.from(REMINDER_HOUR_TO_MINUTES.keys());

export type NotificationItem = {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListMeta = {
  cursor?: string | null;
  limit: number;
  count: number;
  usingCursor: boolean;
};

export type NotificationListResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  meta: NotificationListMeta;
};

export type NotificationQueryParams = {
  cursor?: string;
  limit?: number;
  type?: NotificationTypeFilter;
};

export type NotificationMutationResult = {
  unreadCount: number;
  notification?: {
    id: string;
    readAt: string | null;
  };
};

export type NotificationChannelPreference = {
  inApp: boolean;
  email: boolean;
};

export type NotificationPreferences = {
  channels: {
    sessionReminders: NotificationChannelPreference;
    matches: NotificationChannelPreference;
    announcements: NotificationChannelPreference;
    messages: NotificationChannelPreference;
  };
  sessionReminders: {
    enabled: boolean;
    offsets: number[];
  };
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    sessionReminders: { inApp: true, email: true },
    matches: { inApp: true, email: true },
    announcements: { inApp: true, email: false },
    messages: { inApp: true, email: true },
  },
  sessionReminders: {
    enabled: true,
    offsets: [...DEFAULT_REMINDER_MINUTES],
  },
};

export const cloneNotificationPreferences = (prefs: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES): NotificationPreferences =>
  JSON.parse(JSON.stringify(prefs));

export const deriveNotificationCategory = (type = ''): NotificationCategory => {
  const upperType = type.toUpperCase();
  const match = Object.entries(TYPE_FILTER_PREFIXES).find(([, prefixes]) =>
    prefixes.some((prefix) => upperType.startsWith(prefix))
  );
  return (match?.[0] as NotificationCategory) || 'system';
};

const mapNotificationPayload = (payload: Partial<NotificationItem>): NotificationItem => ({
  id: payload.id || (payload as any)._id || crypto.randomUUID?.() || `${Date.now()}`,
  type: payload.type || 'SYSTEM_GENERIC',
  category: deriveNotificationCategory(payload.type),
  title: payload.title || 'Notification',
  message: payload.message || '',
  data: (payload.data && typeof payload.data === 'object') ? payload.data : {},
  readAt: payload.readAt ?? null,
  createdAt: payload.createdAt || new Date().toISOString(),
});

const normalizeMeta = (meta: Partial<NotificationListMeta> | undefined, fallbackLimit: number, count: number): NotificationListMeta => ({
  cursor: meta?.cursor ?? null,
  limit: meta?.limit ?? fallbackLimit,
  count: meta?.count ?? count,
  usingCursor: !!meta?.usingCursor,
});

export const fetchNotifications = async (params: NotificationQueryParams = {}): Promise<NotificationListResponse> => {
  const { data } = await apiClient.get('/notifications', { params });
  const notificationsRaw = Array.isArray(data?.notifications) ? data.notifications : [];
  const notifications: NotificationItem[] = notificationsRaw.map((item: Partial<NotificationItem>) =>
    mapNotificationPayload(item)
  );
  const limit = params.limit ?? 50;
  return {
    notifications,
    unreadCount: typeof data?.unreadCount === 'number' ? data.unreadCount : notifications.filter((n) => !n.readAt).length,
    meta: normalizeMeta(data?.meta, limit, notifications.length),
  };
};

export const markNotificationRead = async (id: string): Promise<NotificationMutationResult> => {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return {
    unreadCount: typeof data?.unreadCount === 'number' ? data.unreadCount : 0,
    notification: data?.notification
      ? {
          id: data.notification.id,
          readAt: data.notification.readAt ?? new Date().toISOString(),
        }
      : undefined,
  };
};

export const markAllNotificationsRead = async (): Promise<NotificationMutationResult> => {
  const { data } = await apiClient.patch('/notifications/read-all');
  return {
    unreadCount: typeof data?.unreadCount === 'number' ? data.unreadCount : 0,
  };
};

const hoursToMinutes = (hoursList?: number[]): number[] => {
  if (!Array.isArray(hoursList) || !hoursList.length) {
    return [...DEFAULT_REMINDER_MINUTES];
  }
  const minutes = hoursList
    .map((hours) => REMINDER_HOUR_TO_MINUTES.get(Number(hours)))
    .filter((value): value is number => Number.isFinite(value));
  return minutes.length ? Array.from(new Set(minutes)) : [...DEFAULT_REMINDER_MINUTES];
};

const minutesToHours = (minutesList?: number[]): number[] => {
  if (!Array.isArray(minutesList) || !minutesList.length) {
    return [...DEFAULT_REMINDER_HOURS];
  }
  const hours = minutesList
    .map((minutes) => REMINDER_MINUTES_TO_HOURS.get(Number(minutes)))
    .filter((value): value is number => Number.isFinite(value));
  return hours.length ? Array.from(new Set(hours)).sort((a, b) => b - a) : [...DEFAULT_REMINDER_HOURS];
};

const mapApiPreferencesToClient = (raw: any): NotificationPreferences => {
  const next = cloneNotificationPreferences();
  next.channels.sessionReminders.email = !!raw?.preferences?.emailSessionReminders || !!raw?.emailSessionReminders;
  next.channels.matches.email = !!raw?.preferences?.emailMatches || !!raw?.emailMatches;
  next.channels.messages.email = !!raw?.preferences?.emailMessages || !!raw?.emailMessages;
  next.channels.announcements.email = !!raw?.preferences?.emailAnnouncements || !!raw?.emailAnnouncements;
  const reminderTimes = raw?.preferences?.reminderTimes ?? raw?.reminderTimes;
  next.sessionReminders.offsets = hoursToMinutes(reminderTimes);
  next.sessionReminders.enabled = next.sessionReminders.offsets.length > 0;
  return next;
};

const mapClientPreferencesToApi = (prefs: NotificationPreferences) => ({
  emailSessionReminders: !!prefs.channels.sessionReminders.email,
  emailMatches: !!prefs.channels.matches.email,
  emailMessages: !!prefs.channels.messages.email,
  emailAnnouncements: !!prefs.channels.announcements.email,
  reminderTimes: minutesToHours(prefs.sessionReminders.offsets),
});

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const { data } = await apiClient.get('/notifications/preferences');
    if (data?.success && data?.preferences) {
      return mapApiPreferencesToClient(data);
    }
  } catch (error) {
    logger.warn('getNotificationPreferences failed, falling back to defaults', error);
  }
  return cloneNotificationPreferences();
};

export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<NotificationPreferences> => {
  const payload = mapClientPreferencesToApi(preferences);
  const { data } = await apiClient.put('/notifications/preferences', payload);
  if (data?.success && data?.preferences) {
    return mapApiPreferencesToClient(data);
  }
  return mapApiPreferencesToClient({ preferences: payload });
};

export type NotificationRealtimePayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
};

export const mapRealtimeNotification = (payload: NotificationRealtimePayload): NotificationItem =>
  mapNotificationPayload({
    id: payload.id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data,
    createdAt: payload.createdAt,
    readAt: null,
  });
