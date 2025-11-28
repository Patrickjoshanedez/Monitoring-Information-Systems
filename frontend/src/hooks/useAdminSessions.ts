import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../shared/config/apiClient';
import logger from '../shared/utils/logger';

export interface AdminSessionParticipant {
    id: string;
    name: string;
    email?: string | null;
}

export interface AdminSessionRecord {
    id: string;
    subject: string;
    date: string;
    status: string;
    isGroup?: boolean;
    mentor?: AdminSessionParticipant | null;
    mentee?: AdminSessionParticipant | null;
    durationMinutes?: number | null;
    completedAt?: string | null;
    attendanceSummary?: {
        total: number;
        present: number;
        late: number;
        absent: number;
        lastRecordedAt: string | null;
    };
    adminReview?: {
        flagged: boolean;
        reason?: string | null;
        notes?: string | null;
        flaggedAt?: string | null;
        flaggedBy?: string | null;
        updatedAt?: string | null;
        updatedBy?: string | null;
    };
}

export interface AdminSessionsResponse {
    sessions: AdminSessionRecord[];
    meta?: {
        pagination?: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export interface AdminSessionFilters {
    mentor?: string;
    mentee?: string;
    limit?: number;
    page?: number;
    sort?: 'newest' | 'oldest';
    status?: 'all' | 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
}

export const adminSessionsKey = ['admin', 'sessions'] as const;

const normalizeParticipant = (participant: any): AdminSessionParticipant | null => {
    if (!participant) {
        return null;
    }
    const composed = `${participant?.firstname ?? ''} ${participant?.lastname ?? ''}`.trim();
    const fallbackName = composed.length ? composed : null;
    return {
        id: participant?.id ?? participant?._id ?? '',
        name: participant?.name ?? participant?.displayName ?? participant?.email ?? fallbackName ?? 'Participant',
        email: participant?.email ?? null,
    };
};

export const normalizeAdminSessionRecord = (session: any): AdminSessionRecord => {
    const attendance = session?.attendanceSummary ?? {};
    const review = session?.adminReview ?? {};
    return {
        id: session?.id ?? session?._id ?? '',
        subject: session?.subject ?? 'Mentoring session',
        date: session?.date ?? session?.scheduledAt ?? '',
        status: session?.status ?? 'pending',
        isGroup: Boolean(session?.isGroup),
        mentor: normalizeParticipant(session?.mentor),
        mentee: normalizeParticipant(session?.mentee),
        durationMinutes: typeof session?.durationMinutes === 'number' ? session.durationMinutes : null,
        completedAt: session?.completedAt ?? null,
        attendanceSummary: {
            total: Number(attendance?.total ?? 0),
            present: Number(attendance?.present ?? 0),
            late: Number(attendance?.late ?? 0),
            absent: Number(attendance?.absent ?? 0),
            lastRecordedAt: attendance?.lastRecordedAt ?? null,
        },
        adminReview: {
            flagged: Boolean(review?.flagged),
            reason: review?.reason ?? null,
            notes: review?.notes ?? null,
            flaggedAt: review?.flaggedAt ?? null,
            flaggedBy: review?.flaggedBy ?? null,
            updatedAt: review?.updatedAt ?? null,
            updatedBy: review?.updatedBy ?? null,
        },
    };
};

const normalizeSessionsResponse = (payload: any): AdminSessionsResponse => {
    const source = payload?.sessions ?? payload?.data?.sessions ?? [];
    const meta = payload?.meta ?? payload?.data?.meta ?? undefined;
    const sessions = Array.isArray(source) ? source.map((session: any) => normalizeAdminSessionRecord(session)) : [];
    return { sessions, meta };
};

const sanitizeFilters = (filters: AdminSessionFilters) => {
    const entries = Object.fromEntries(
        Object.entries(filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => [key, value])
    );
    if (entries.status === 'all') {
        delete entries.status;
    }
    return entries;
};

export const useAdminSessions = (filters: AdminSessionFilters, options?: { enabled?: boolean }) => {
    return useQuery<AdminSessionsResponse>({
        queryKey: [...adminSessionsKey, filters],
        queryFn: async () => {
            const params = sanitizeFilters(filters);
            const { data } = await apiClient.get('/admin/sessions', { params });
            return normalizeSessionsResponse(data);
        },
        enabled: options?.enabled ?? true,
        keepPreviousData: true,
        onError: (error) => {
            logger.error('Failed to load admin sessions', error);
        },
    });
};
