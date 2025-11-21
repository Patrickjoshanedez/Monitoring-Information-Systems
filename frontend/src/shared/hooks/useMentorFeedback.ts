import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
    fetchMentorFeedbackForSession,
    createMentorFeedback,
    updateMentorFeedback,
    MentorFeedbackRecord,
} from '../services/mentorFeedbackService';
import { mentorSessionsKey } from './useMentorSessions';
import { progressSnapshotKey } from './useGoals';

const buildSessionMentorFeedbackKey = (sessionId?: string | null) => ['mentorFeedback', 'session', sessionId];

export const useMentorFeedbackForSession = (sessionId?: string | null, options?: { enabled?: boolean }) => {
    return useQuery<MentorFeedbackRecord | null, AxiosError>({
        queryKey: buildSessionMentorFeedbackKey(sessionId),
        queryFn: () => fetchMentorFeedbackForSession(sessionId as string),
        enabled: Boolean(sessionId) && (options?.enabled ?? true),
        staleTime: 60 * 1000,
    });
};

export const useCreateMentorFeedback = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Parameters<typeof createMentorFeedback>[0]) => createMentorFeedback(payload),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: mentorSessionsKey });
            qc.invalidateQueries({ queryKey: progressSnapshotKey });
            qc.invalidateQueries({ queryKey: buildSessionMentorFeedbackKey(variables.sessionId) });
        },
    });
};

export const useUpdateMentorFeedback = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Parameters<typeof updateMentorFeedback>[0]) => updateMentorFeedback(payload),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: mentorSessionsKey });
            qc.invalidateQueries({ queryKey: progressSnapshotKey });
            qc.invalidateQueries({ queryKey: buildSessionMentorFeedbackKey(variables.sessionId) });
        },
    });
};

export default useMentorFeedbackForSession;
