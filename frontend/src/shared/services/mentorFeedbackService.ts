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
