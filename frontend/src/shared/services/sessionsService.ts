import { apiClient } from '../config/apiClient';

export interface SessionParticipant {
    id: string | null;
    name: string;
    email?: string;
}

export interface SessionRecord {
    id: string;
    subject: string;
    mentor: SessionParticipant | null;
    mentee?: SessionParticipant | null;
    date: string;
    durationMinutes: number;
    attended: boolean;
    tasksCompleted: number;
    notes: string | null;
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

export interface CompleteSessionPayload {
    attended?: boolean;
    tasksCompleted?: number;
    notes?: string | null;
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
