import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { completeSession, CompleteSessionPayload, fetchMenteeSessions, MenteeSession } from '../services/sessionsService';

export const menteeSessionsKey = ['sessions', 'mentee'];

export const useMenteeSessions = () =>
    useQuery<MenteeSession[]>(menteeSessionsKey, fetchMenteeSessions, {
        staleTime: 60_000,
        cacheTime: 5 * 60_000,
    });

export const useUpcomingSessions = () => {
    const query = useMenteeSessions();

    const upcomingSessions = useMemo(() => {
        if (!query.data) return [];
        return query.data.filter((session: MenteeSession) => !session.attended);
    }, [query.data]);

    return { ...query, sessions: upcomingSessions };
};

export const useCompletedSessions = () => {
    const query = useMenteeSessions();

    const completedSessions = useMemo(() => {
        if (!query.data) return [];
        return query.data.filter((session: MenteeSession) => !!session.attended);
    }, [query.data]);

    return { ...query, sessions: completedSessions };
};

export const useCompleteSession = () => {
    const queryClient = useQueryClient();

    return useMutation(
        ({ sessionId, payload }: { sessionId: string; payload: CompleteSessionPayload }) => completeSession(sessionId, payload),
        {
            onSuccess: (updatedSession) => {
                queryClient.setQueryData<MenteeSession[] | undefined>(menteeSessionsKey, (prev) => {
                    if (!prev) return prev;
                    return prev.map((session) => (session.id === updatedSession.id ? updatedSession : session));
                });
            },
        }
    );
};
