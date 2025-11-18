import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/config/apiClient';

const MATERIAL_UPLOAD_TIMEOUT_MS = Number(importMetaEnv?.VITE_MATERIAL_UPLOAD_TIMEOUT_MS ?? 60_000);

export interface MaterialItem {
    id: string;
    title: string;
    originalName?: string;
    mimeType: string;
    fileSize: number;
    googleDriveWebViewLink?: string;
    googleDriveDownloadLink?: string;
    createdAt: string;
}

const menteeMaterialsKey = ['materials', 'mentee'];

export const useMenteeMaterials = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: [...menteeMaterialsKey, params ?? {}],
        queryFn: async () => {
            const response = await apiClient.get('/mentee', { params });
            return (response.data?.data?.materials ?? []) as MaterialItem[];
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

            const response = await apiClient.post(`/sessions/${sessionId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: MATERIAL_UPLOAD_TIMEOUT_MS,
            });
            return (response.data?.data?.materials ?? []) as MaterialItem[];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menteeMaterialsKey });
        },
    });
};

export const useDeleteMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (materialId: string) => {
            await apiClient.delete(`/${materialId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menteeMaterialsKey });
        },
    });
};

export const buildPreviewUrl = (materialId: string) => `/api/${materialId}/preview`;
