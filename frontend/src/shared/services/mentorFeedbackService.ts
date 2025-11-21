import { apiClient } from '../config/apiClient';

export interface SnapshotTrendPoint {
    month: string;
    avg: number;
    count: number;
}

export interface SnapshotComment {
    feedbackId: string | null;
    mentorId: string | null;
    mentorName: string;
    rating: number;
    visibility: 'public' | 'private';
    comment: string | null;
    createdAt: string | null;
}

export interface SnapshotMilestones {
    reached: number;
    lastUpdatedAt: string | null;
}

export interface MenteeProgressSnapshot {
    menteeId: string | null;
    ratingAvg: number;
    ratingCount: number;
    monthlyTrend: SnapshotTrendPoint[];
    recentComments: SnapshotComment[];
    milestones: SnapshotMilestones;
    lastUpdated: string | null;
}

export const fetchMenteeProgressSnapshot = async (): Promise<MenteeProgressSnapshot> => {
    const { data } = await apiClient.get<{ snapshot: MenteeProgressSnapshot }>(
        '/mentor-feedback/progress'
    );

    return data.snapshot;
};

export const fetchProgressSnapshotForMentee = async (menteeId: string): Promise<MenteeProgressSnapshot> => {
    const { data } = await apiClient.get<{ snapshot: MenteeProgressSnapshot }>(`/mentor-feedback/mentees/${menteeId}/progress`);
    return data.snapshot;
};

export interface MentorFeedbackCreatePayload {
    sessionId: string;
    rating: number;
    comment?: string | null;
    visibility?: 'public' | 'private';
    competencies?: Array<{ skillKey: string; level: number; notes?: string }>;
}

export interface MentorFeedbackRecord {
    id: string;
    sessionId: string;
    menteeId: string | null;
    rating: number;
    competencies: Array<{ skillKey: string; level: number; notes?: string }>;
    comment: string | null;
    sanitizedComment: string | null;
    visibility: 'public' | 'private';
    editWindowClosesAt?: string | null;
    createdAt: string;
    updatedAt?: string;
}

export const fetchMentorFeedbackForSession = async (sessionId: string) => {
    const { data } = await apiClient.get<{ feedback: MentorFeedbackRecord | null }>(`/sessions/${sessionId}/mentor-feedback`);
    return data.feedback;
};

export const createMentorFeedback = async (payload: MentorFeedbackCreatePayload) => {
    const { sessionId, ...body } = payload;
    const { data } = await apiClient.post<{ feedback: MentorFeedbackRecord }>(`/sessions/${sessionId}/mentor-feedback`, body);
    return data.feedback;
};

export const updateMentorFeedback = async (payload: MentorFeedbackCreatePayload) => {
    const { sessionId, ...body } = payload;
    const { data } = await apiClient.put<{ feedback: MentorFeedbackRecord }>(`/sessions/${sessionId}/mentor-feedback`, body);
    return data.feedback;
};
