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
}

const adminSessionsKey = ['admin', 'sessions'] as const;

const normalizeSessionsResponse = (payload: any): AdminSessionsResponse => {
    const source = payload?.sessions ?? payload?.data?.sessions ?? [];
    const meta = payload?.meta ?? payload?.data?.meta ?? undefined;
    const sessions = Array.isArray(source)
        ? source.map((session: any) => ({
              id: session?.id ?? session?._id ?? '',
              subject: session?.subject ?? 'Mentoring session',
              date: session?.date ?? session?.scheduledAt ?? '',
              status: session?.status ?? 'pending',
              isGroup: Boolean(session?.isGroup),
              mentor: session?.mentor
                  ? {
                        id: session.mentor.id ?? session.mentor._id ?? '',
                        name: session.mentor.name ?? session.mentor.displayName ?? session.mentor.email ?? 'Mentor',
                        email: session.mentor.email ?? null,
                    }
                  : null,
              mentee: session?.mentee
                  ? {
                        id: session.mentee.id ?? session.mentee._id ?? '',
                        name: session.mentee.name ?? session.mentee.displayName ?? session.mentee.email ?? 'Mentee',
                        email: session.mentee.email ?? null,
                    }
                  : null,
          }))
        : [];
    return { sessions, meta };
};

export const useAdminSessions = (filters: AdminSessionFilters, options?: { enabled?: boolean }) => {
    return useQuery<AdminSessionsResponse>({
        queryKey: [...adminSessionsKey, filters],
        queryFn: async () => {
            const { data } = await apiClient.get('/admin/sessions', { params: filters });
            return normalizeSessionsResponse(data);
        },
        enabled: options?.enabled ?? true,
        keepPreviousData: true,
        onError: (error) => {
            logger.error('Failed to load admin sessions', error);
        },
    });
};
