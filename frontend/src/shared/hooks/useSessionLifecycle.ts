import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
    AttendancePayload,
    BookSessionPayload,
    BookingLockPayload,
    BookingLockResult,
    CancelSessionPayload,
    MentorSession,
    MenteeSession,
    RescheduleSessionPayload,
    SessionRecord,
    SessionResponse,
} from '../services/sessionsService';
import {
    bookSession,
    cancelSession,
    confirmSession,
    createBookingLock,
    getSessionDetail,
    recordAttendance,
    rescheduleSession,
} from '../services/sessionsService';
import { menteeSessionsKey } from './useMenteeSessions';
import { mentorSessionsKey } from './useMentorSessions';

export const sessionDetailKey = (sessionId: string) => ['session-detail', sessionId] as const;

const upsertSessionList = <T extends SessionRecord>(list: T[] | undefined, updated: SessionRecord): T[] | undefined => {
    if (!list) {
        return list;
    }
    const exists = list.some((session) => session.id === updated.id);
    if (!exists) {
        return [updated as T, ...list];
    }
    return list.map((session) => (session.id === updated.id ? ({ ...session, ...updated } as T) : session));
};

const updateSessionCaches = (queryClient: ReturnType<typeof useQueryClient>, updated: SessionRecord) => {
    queryClient.setQueryData<MentorSession[] | undefined>(mentorSessionsKey, (prev) => upsertSessionList(prev, updated));
    queryClient.setQueryData<MenteeSession[] | undefined>(menteeSessionsKey, (prev) => upsertSessionList(prev, updated));
    queryClient.setQueryData<SessionResponse | undefined>(sessionDetailKey(updated.id), (prev) => {
        if (!prev) {
            return { session: updated };
        }
        return { ...prev, session: { ...prev.session, ...updated } };
    });
};

export const useSessionDetail = (sessionId?: string, options?: { enabled?: boolean }) =>
    useQuery<SessionResponse>(
        sessionId ? sessionDetailKey(sessionId) : ['session-detail', 'missing'],
        () => getSessionDetail(sessionId!),
        {
            enabled: Boolean(sessionId) && (options?.enabled ?? true),
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        }
    );

export const useBookingLock = () =>
    useMutation<BookingLockResult, unknown, BookingLockPayload>((payload) => createBookingLock(payload));

export const useBookSession = () => {
    const queryClient = useQueryClient();
    return useMutation<SessionResponse, unknown, BookSessionPayload>((payload) => bookSession(payload), {
        onSuccess: ({ session }) => {
            updateSessionCaches(queryClient, session);
        },
    });
};

export const useConfirmSession = () => {
    const queryClient = useQueryClient();
    return useMutation<SessionResponse, unknown, { sessionId: string }>((variables) => confirmSession(variables.sessionId), {
        onSuccess: ({ session }) => {
            updateSessionCaches(queryClient, session);
        },
    });
};

export const useRescheduleSession = () => {
    const queryClient = useQueryClient();
    return useMutation<SessionResponse, unknown, { sessionId: string; payload: RescheduleSessionPayload }>(
        ({ sessionId, payload }) => rescheduleSession(sessionId, payload),
        {
            onSuccess: ({ session }) => {
                updateSessionCaches(queryClient, session);
            },
        }
    );
};

export const useCancelSession = () => {
    const queryClient = useQueryClient();
    return useMutation<SessionResponse, unknown, { sessionId: string; payload?: CancelSessionPayload }>(
        ({ sessionId, payload }) => cancelSession(sessionId, payload),
        {
            onSuccess: ({ session }) => {
                updateSessionCaches(queryClient, session);
            },
        }
    );
};

export const useRecordSessionAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation<SessionResponse, unknown, { sessionId: string; payload: AttendancePayload }>(
        ({ sessionId, payload }) => recordAttendance(sessionId, payload),
        {
            onSuccess: ({ session }) => {
                updateSessionCaches(queryClient, session);
            },
        }
    );
};
