import { apiClient } from '../../../shared/config/apiClient';

export type PairingStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface PairingPerson {
    id: string | null;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string | null;
    applicationStatus: string | null;
    capacity: number | null;
    activeMentees: number | null;
}

export interface PairingRecord {
    id: string;
    status: PairingStatus;
    startedAt: string;
    updatedAt: string;
    mentor: PairingPerson | null;
    mentee: PairingPerson | null;
    metadata: {
        notes?: string | null;
        goals?: string | null;
        program?: string | null;
        [key: string]: unknown;
    };
    sessionsCount: number;
    matchRequest?: {
        id: string | null;
        status?: string;
        score?: number;
        notes?: string | null;
        priority?: number;
        metadata?: Record<string, unknown>;
    } | null;
}

export interface PairingFilters {
    search?: string;
    status?: 'all' | PairingStatus;
    page?: number;
    limit?: number;
}

interface PairingListResponse {
    success: boolean;
    pairings: PairingRecord[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        filters: { search: string; status: string };
    };
}

interface PairingDetailResponse {
    success: boolean;
    pairing: PairingRecord;
    auditTrail: Array<{ id: string; action: string; metadata: Record<string, unknown>; createdAt: string }>;
}

interface PairingUpdateResponse {
    success: boolean;
    pairing: PairingRecord;
}

export const fetchPairings = async (params: PairingFilters) => {
    const { data } = await apiClient.get<PairingListResponse>('/admin/matching/pairings', { params });
    return data;
};

export const fetchPairingDetail = async (pairingId: string) => {
    const { data } = await apiClient.get<PairingDetailResponse>(`/admin/matching/pairings/${pairingId}`);
    return data;
};

export const updatePairing = async (
    pairingId: string,
    payload: Partial<{ status: PairingStatus; notes: string | null; goals: string | null; program: string | null; reason?: string }>
) => {
    const { data } = await apiClient.patch<PairingUpdateResponse>(`/admin/matching/pairings/${pairingId}`, payload);
    return data.pairing;
};
