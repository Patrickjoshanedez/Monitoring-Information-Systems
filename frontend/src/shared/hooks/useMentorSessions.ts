import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { completeSession, CompleteSessionPayload, fetchMentorSessions, MentorSession, MenteeSession } from '../services/sessionsService';
import { menteeSessionsKey } from './useMenteeSessions';

export const mentorSessionsKey = ['sessions', 'mentor'];

export const useMentorSessions = () =>
    useQuery<MentorSession[]>(mentorSessionsKey, fetchMentorSessions, {
        staleTime: 60_000,
        cacheTime: 5 * 60_000,
    });

export const useCompleteMentorSession = () => {
    const queryClient = useQueryClient();

    return useMutation(
        ({ sessionId, payload }: { sessionId: string; payload: CompleteSessionPayload }) => completeSession(sessionId, payload),
        {
            onSuccess: (updatedSession) => {
                queryClient.setQueryData<MentorSession[] | undefined>(mentorSessionsKey, (prev) => {
                    if (!prev) return prev;
                    return prev.map((session) => (session.id === updatedSession.id ? { ...session, ...updatedSession } : session));
                });

                queryClient.setQueryData<MenteeSession[] | undefined>(menteeSessionsKey, (prev) => {
                    if (!prev) return prev;
                    return prev.map((session) => (session.id === updatedSession.id ? { ...session, ...updatedSession } : session));
                });
            },
        }
    );
};
