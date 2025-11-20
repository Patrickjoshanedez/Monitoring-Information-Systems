import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/config/apiClient';

const MATERIAL_UPLOAD_TIMEOUT_MS = (() => {
    const parsed = Number(import.meta.env.VITE_MATERIAL_UPLOAD_TIMEOUT_MS ?? 60_000);
    return Number.isFinite(parsed) ? parsed : 60_000;
})();

export interface MaterialItem {
    id: string;
    title: string;
    originalName?: string;
    mimeType: string;
    fileSize: number;
    googleDriveWebViewLink?: string;
    googleDriveDownloadLink?: string;
    createdAt: string;
    sessionId?: string;
    sessionSubject?: string | null;
    sessionDate?: string | null;
    mentorName?: string | null;
    mentorEmail?: string | null;
}

export interface MaterialsMeta {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

export interface MentorMaterialsResult {
    materials: MaterialItem[];
    meta?: MaterialsMeta | null;
}

export interface MaterialSessionOption {
    id: string;
    subject: string;
    date?: string | null;
    mentorName?: string | null;
}

export interface MenteeMaterialsResult {
    materials: MaterialItem[];
    sessions: MaterialSessionOption[];
}

const menteeMaterialsKey = ['materials', 'mentee'] as const;
const mentorMaterialsKey = ['materials', 'mentor'] as const;

const extractMaterialsArray = (response: any): MaterialItem[] => {
    const possible =
        response?.data?.data?.materials ??
        response?.data?.materials ??
        response?.data ??
        [];
    return Array.isArray(possible) ? (possible as MaterialItem[]) : [];
};

const invalidateMaterialQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: menteeMaterialsKey });
    queryClient.invalidateQueries({ queryKey: mentorMaterialsKey });
};

export const useMenteeMaterials = (params?: { page?: number; limit?: number; search?: string; sessionId?: string }) => {
    return useQuery<MenteeMaterialsResult>({
        queryKey: [...menteeMaterialsKey, params ?? {}],
        queryFn: async () => {
            const response = await apiClient.get('/materials/mentee', { params });
            const materials = extractMaterialsArray(response);
            const sessions = response?.data?.data?.sessions ?? response?.data?.sessions ?? [];
            return {
                materials,
                sessions: Array.isArray(sessions) ? (sessions as MaterialSessionOption[]) : [],
            };
        },
    });
};

export const useMentorMaterials = (params?: { page?: number; limit?: number; search?: string; sessionId?: string }) => {
    return useQuery<MentorMaterialsResult>({
        queryKey: [...mentorMaterialsKey, params ?? {}],
        queryFn: async () => {
            const response = await apiClient.get('/materials/mentor', { params });
            return {
                materials: extractMaterialsArray(response),
                meta: response.data?.meta ?? response.data?.data?.meta ?? null,
            };
        },
    });
};

export const useUploadSessionMaterials = (sessionId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { files: File[]; menteeIds?: string[] }) => {
            const formData = new FormData();
            payload.files.forEach((file) => formData.append('files', file));
            if (payload.menteeIds && payload.menteeIds.length) {
                payload.menteeIds.forEach((id) => formData.append('menteeIds', id));
            }

            const response = await apiClient.post(`/materials/sessions/${sessionId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: MATERIAL_UPLOAD_TIMEOUT_MS,
            });
            return extractMaterialsArray(response);
        },
        onSuccess: () => {
            invalidateMaterialQueries(queryClient);
        },
    });
};

export const useDeleteMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (materialId: string) => {
            await apiClient.delete(`/materials/${materialId}`);
        },
        onSuccess: () => {
            invalidateMaterialQueries(queryClient);
        },
    });
};

export const buildPreviewUrl = (materialId: string) => `/api/materials/${materialId}/preview`;
