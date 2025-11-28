import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, API_BASE_URL } from '../shared/config/apiClient';
import logger from '../shared/utils/logger';

export type AdminFeedbackSentiment = 'all' | 'low' | 'high';
export type AdminFeedbackFlagFilter = 'all' | 'flagged' | 'unflagged';

export interface AdminFeedbackParticipant {
    id: string;
    name: string;
    email?: string | null;
}

export interface AdminFeedbackSessionSummary {
    id: string | null;
    subject: string;
    date?: string | null;
    status?: string | null;
}

export interface AdminFeedbackModeration {
    flagged: boolean;
    reason?: string | null;
    flaggedAt?: string | null;
    flaggedBy?: string | null;
}

export interface AdminFeedbackRecord {
    id: string;
    rating: number;
    visibility: 'public' | 'private';
    comment?: string | null;
    sanitizedComment?: string | null;
    competencies?: Array<{ skillKey: string; level: number; notes?: string }>;
    createdAt?: string | null;
    updatedAt?: string | null;
    mentor?: AdminFeedbackParticipant | null;
    mentee?: AdminFeedbackParticipant | null;
    session?: AdminFeedbackSessionSummary | null;
    moderation?: AdminFeedbackModeration;
}

export interface AdminFeedbackListResponse {
    feedback: AdminFeedbackRecord[];
    meta?: {
        pagination?: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export interface AdminFeedbackFilters {
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest' | 'rating-high' | 'rating-low';
    sentiment?: AdminFeedbackSentiment;
    flagged?: AdminFeedbackFlagFilter;
    search?: string;
    commentOnly?: boolean;
}

export interface AdminFeedbackSummary {
    totalCount: number;
    flaggedCount: number;
    lowRatingCount: number;
    lowRatingThreshold: number;
    ratingDistribution: Record<number, number>;
    recentLowRatings: AdminFeedbackRecord[];
}

const adminFeedbackKey = ['admin', 'feedback', 'mentor'] as const;
export const adminFeedbackSummaryKey = ['admin', 'feedback', 'mentor', 'summary'] as const;

const normalizeParticipant = (participant: any): AdminFeedbackParticipant | null => {
    if (!participant) {
        return null;
    }
    const composed = `${participant?.firstname ?? ''} ${participant?.lastname ?? ''}`.trim();
    const resolvedName = participant?.name ?? participant?.displayName ?? (composed || participant?.email || 'User');
    return {
        id: participant?.id ?? participant?._id ?? '',
        name: resolvedName,
        email: participant?.email ?? null,
    };
};

const normalizeSessionSummary = (session: any): AdminFeedbackSessionSummary | null => {
    if (!session) {
        return null;
    }
    return {
        id: session?.id ?? session?._id ?? null,
        subject: session?.subject ?? 'Mentoring session',
        date: session?.date ?? session?.completedAt ?? null,
        status: session?.status ?? null,
    };
};

const normalizeModeration = (moderation: any): AdminFeedbackModeration => ({
    flagged: Boolean(moderation?.flagged),
    reason: moderation?.reason ?? null,
    flaggedAt: moderation?.flaggedAt ?? null,
    flaggedBy: moderation?.flaggedBy ?? null,
});

const normalizeRecord = (record: any): AdminFeedbackRecord => ({
    id: record?.id ?? record?._id ?? '',
    rating: Number(record?.rating ?? 0),
    visibility: record?.visibility === 'private' ? 'private' : 'public',
    comment: record?.comment ?? null,
    sanitizedComment: record?.sanitizedComment ?? null,
    competencies: Array.isArray(record?.competencies) ? record.competencies : [],
    createdAt: record?.createdAt ?? null,
    updatedAt: record?.updatedAt ?? null,
    mentor: normalizeParticipant(record?.mentor),
    mentee: normalizeParticipant(record?.mentee),
    session: normalizeSessionSummary(record?.session),
    moderation: normalizeModeration(record?.moderation),
});

const normalizeListResponse = (payload: any): AdminFeedbackListResponse => {
    const source = payload?.feedback ?? payload?.data?.feedback ?? [];
    const meta = payload?.meta ?? payload?.data?.meta;
    const feedback = Array.isArray(source) ? source.map((entry) => normalizeRecord(entry)) : [];
    return { feedback, meta };
};

const sanitizeFilters = (filters: AdminFeedbackFilters = {}): Record<string, string> => {
    const params: Record<string, string> = {};

    if (filters.page && filters.page > 0) {
        params.page = String(filters.page);
    }
    if (filters.limit && filters.limit > 0) {
        params.limit = String(filters.limit);
    }
    if (filters.sort) {
        params.sort = filters.sort;
    }
    if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
    }
    if (filters.sentiment && filters.sentiment !== 'all') {
        params.sentiment = filters.sentiment;
    }
    if (filters.flagged === 'flagged') {
        params.flagged = 'true';
    } else if (filters.flagged === 'unflagged') {
        params.flagged = 'false';
    }
    if (filters.commentOnly) {
        params.commentOnly = 'true';
    }

    return params;
};

export const buildAdminFeedbackExportUrl = (filters: AdminFeedbackFilters = {}) => {
    const params = new URLSearchParams(sanitizeFilters(filters));
    const query = params.toString();
    const base = `${API_BASE_URL}/admin/feedback/mentor/export`;
    return query ? `${base}?${query}` : base;
};

export const useAdminFeedbackList = (filters: AdminFeedbackFilters, options?: { enabled?: boolean }) => {
    return useQuery<AdminFeedbackListResponse>({
        queryKey: [...adminFeedbackKey, filters],
        queryFn: async () => {
            const params = sanitizeFilters(filters);
            const { data } = await apiClient.get('/admin/feedback/mentor', { params });
            return normalizeListResponse(data);
        },
        keepPreviousData: true,
        enabled: options?.enabled ?? true,
        onError: (error) => {
            logger.error('Failed to load admin mentor feedback', error);
        },
    });
};

const defaultSummary: AdminFeedbackSummary = {
    totalCount: 0,
    flaggedCount: 0,
    lowRatingCount: 0,
    lowRatingThreshold: 3,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentLowRatings: [],
};

export const useAdminFeedbackSummary = (options?: { enabled?: boolean }) => {
    return useQuery<AdminFeedbackSummary>({
        queryKey: adminFeedbackSummaryKey,
        queryFn: async () => {
            const { data } = await apiClient.get('/admin/feedback/mentor/summary');
            return data?.summary ? {
                ...defaultSummary,
                ...data.summary,
                ratingDistribution: {
                    ...defaultSummary.ratingDistribution,
                    ...(data.summary.ratingDistribution ?? {}),
                },
                recentLowRatings: Array.isArray(data.summary.recentLowRatings)
                    ? data.summary.recentLowRatings.map((entry: any) => normalizeRecord(entry))
                    : [],
            } : defaultSummary;
        },
        staleTime: 60 * 1000,
        enabled: options?.enabled ?? true,
        onError: (error) => {
            logger.error('Failed to load admin feedback summary', error);
        },
    });
};

export interface AdminFeedbackModerationPayload {
    feedbackId: string;
    flagged?: boolean;
    reason?: string | null;
}

export const useAdminFeedbackModeration = () => {
    const queryClient = useQueryClient();
    return useMutation<AdminFeedbackRecord, unknown, AdminFeedbackModerationPayload>({
        mutationFn: async ({ feedbackId, ...body }) => {
            const { data } = await apiClient.patch(`/admin/feedback/mentor/${feedbackId}/moderation`, body);
            const record = data?.feedback ?? data?.data?.feedback;
            return normalizeRecord(record);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminFeedbackKey });
            queryClient.invalidateQueries({ queryKey: adminFeedbackSummaryKey });
        },
        onError: (error) => {
            logger.error('Admin feedback moderation failed', error);
        },
    });
};

export const adminFeedbackKeys = {
    base: adminFeedbackKey,
    summary: adminFeedbackSummaryKey,
};
