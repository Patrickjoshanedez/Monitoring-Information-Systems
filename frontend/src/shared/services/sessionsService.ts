import type { AxiosResponse } from 'axios';
import { apiClient } from '../config/apiClient';

export interface SessionParticipant {
    id: string | null;
    name: string;
    email?: string;
    status?: string;
    avatar?: string | null;
}

export interface SessionRecord {
    id: string;
    subject: string;
    mentor: SessionParticipant | null;
    mentee?: SessionParticipant | null;
    participants?: SessionParticipant[];
    participantCount?: number;
    room?: string | null;
    capacity?: number | null;
    isGroup?: boolean;
    chatThreadId?: string | null;
    date: string;
    durationMinutes: number;
    attended: boolean;
    tasksCompleted: number;
    notes: string | null;
    status?: 'upcoming' | 'completed' | 'overdue' | 'cancelled';
    completedAt?: string | null;
    feedbackDue?: boolean;
    feedbackSubmitted?: boolean;
    feedbackWindowClosesAt?: string | null;
}

export type MenteeSession = SessionRecord;
export type MentorSession = SessionRecord;

export interface SessionsResponse {
    success: boolean;
    sessions: SessionRecord[];
    meta?: {
        cursor?: string | null;
        hasMore?: boolean;
        page?: number;
    };
}

export interface ApiWarning {
    code: string;
    message: string;
}

export interface CompleteSessionPayload {
    attended?: boolean;
    tasksCompleted?: number;
    notes?: string | null;
}

export interface CreateMentorSessionPayload {
    subject: string;
    date: string; // ISO string
    durationMinutes: number;
    room: string;
    capacity: number;
    participantIds: string[];
}

export interface CreateMentorSessionResult {
    session: SessionRecord;
    warnings?: ApiWarning[];
}

export const fetchMenteeSessions = async (): Promise<MenteeSession[]> => {
    const { data } = await apiClient.get<SessionsResponse>('/sessions');
    return data.sessions || [];
};

export const fetchMentorSessions = async (): Promise<MentorSession[]> => {
    const { data } = await apiClient.get<SessionsResponse>('/mentor/sessions');
    return data.sessions || [];
};

export const completeSession = async (
    sessionId: string,
    payload: CompleteSessionPayload = {}
): Promise<SessionRecord> => {
    const { data } = await apiClient.patch<{ success: boolean; session: SessionRecord }>(
        `/sessions/${sessionId}/complete`,
        payload
    );

    return data.session;
};

export const createMentorSession = async (payload: CreateMentorSessionPayload): Promise<CreateMentorSessionResult> => {
    const { data } = await apiClient.post<{
        success: boolean;
        session: SessionRecord;
        meta?: { warnings?: ApiWarning[] };
    }>('/mentor/sessions', payload);

    const warnings = data.meta?.warnings && data.meta.warnings.length ? data.meta.warnings : undefined;
    return { session: data.session, warnings };
};

export const exportMenteeSessionsReport = async (
    format: 'csv' | 'pdf' = 'csv'
): Promise<AxiosResponse<Blob>> =>
    apiClient.get('/sessions/export', {
        params: { format },
        responseType: 'blob',
    });
