import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/config/apiClient';
import logger from '../shared/utils/logger';

export type AdminNotificationScope = 'all' | 'roles' | 'custom';

export interface AdminNotificationAudience {
    scope: AdminNotificationScope;
    roles?: string[];
    userIds?: string[];
    emails?: string[];
}

export interface AdminNotificationChannels {
    inApp?: boolean;
    email?: boolean;
}

export interface AdminPublishOptions {
    publishToAnnouncements?: boolean;
    title?: string;
    body?: string;
    summary?: string;
    category?: string;
    isFeatured?: boolean;
    publishedAt?: string;
}

export interface AdminNotificationPayload {
    title: string;
    message: string;
    type?: string;
    data?: Record<string, unknown>;
    audience: AdminNotificationAudience;
    channels?: AdminNotificationChannels;
    publishOptions?: AdminPublishOptions;
}

export interface AdminNotificationLogEntry {
    id: string;
    title: string;
    message: string;
    type: string;
    audienceScope: AdminNotificationScope;
    audienceFilters?: {
        roles?: string[];
        userIds?: string[];
        emails?: string[];
    };
    recipientCount: number;
    channels: {
        inApp: boolean;
        email: boolean;
    };
    failures: number;
    createdAt: string;
    createdBy: {
        name: string;
        email: string;
    } | null;
    announcement?: {
        id: string;
        audience: string;
        category?: string;
        title?: string;
    } | null;
}

const adminNotificationLogsKey = ['admin', 'notifications', 'logs'] as const;

const fallbackId = () => `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeLog = (raw: any): AdminNotificationLogEntry => ({
    id: raw?.id ?? raw?._id ?? fallbackId(),
    title: raw?.title ?? '',
    message: raw?.message ?? '',
    type: raw?.type ?? '',
    audienceScope: (raw?.audienceScope as AdminNotificationScope) ?? 'all',
    audienceFilters: {
        roles: raw?.audienceFilters?.roles ?? [],
        userIds: raw?.audienceFilters?.userIds ?? [],
        emails: raw?.audienceFilters?.emails ?? [],
    },
    recipientCount: Number(raw?.recipientCount ?? 0),
    channels: {
        inApp: Boolean(raw?.channels?.inApp ?? true),
        email: Boolean(raw?.channels?.email ?? false),
    },
    failures: Number(raw?.failures ?? raw?.metadata?.failures ?? 0),
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    createdBy: raw?.createdBy
        ? {
              name: raw.createdBy.name ?? raw.createdBy.email ?? 'Admin',
              email: raw.createdBy.email ?? 'n/a',
          }
        : null,
    announcement: raw?.announcement
        ? {
              id: raw.announcement.id ?? raw.announcement._id ?? '',
              audience: raw.announcement.audience,
              category: raw.announcement.category,
              title: raw.announcement.title,
          }
        : null,
});

export const useAdminNotificationLogs = () => {
    return useQuery<AdminNotificationLogEntry[]>({
        queryKey: adminNotificationLogsKey,
        queryFn: async () => {
            const { data } = await apiClient.get('/admin/notifications/logs');
            const source = data?.logs ?? data?.data?.logs ?? [];
            return Array.isArray(source) ? source.map(normalizeLog) : [];
        },
        staleTime: 60_000,
        refetchInterval: 60_000,
    });
};

export const useSendAdminNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: AdminNotificationPayload) => {
            const { data } = await apiClient.post('/admin/notifications', payload);
            return data?.data ?? data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminNotificationLogsKey });
        },
        onError: (error: unknown) => {
            logger.error('Admin notification send failed', error);
        },
    });
};
