import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/config/apiClient';
import logger from '../shared/utils/logger';
import { AdminSessionRecord, adminSessionsKey, normalizeAdminSessionRecord } from './useAdminSessions';

export interface AdminSessionReviewPayload {
    sessionId: string;
    status?: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
    flagged?: boolean;
    reason?: string | null;
    notes?: string | null;
}

export const useAdminSessionReview = () => {
    const queryClient = useQueryClient();
    return useMutation<AdminSessionRecord, unknown, AdminSessionReviewPayload>({
        mutationFn: async ({ sessionId, ...body }) => {
            const { data } = await apiClient.patch(`/admin/sessions/${sessionId}/review`, body);
            const session = data?.session ?? data?.data?.session ?? {};
            return normalizeAdminSessionRecord(session);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminSessionsKey });
        },
        onError: (error: unknown) => {
            logger.error('Admin session review update failed', error);
        },
    });
};
