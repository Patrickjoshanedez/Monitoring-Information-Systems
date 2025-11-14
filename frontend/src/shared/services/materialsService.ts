import { apiClient } from '../../shared/config/apiClient';

export interface MaterialItem {
    id: string;
    title: string;
    description: string | null;
    sizeBytes: number;
    mimeType: string;
    tags: string[];
    visibility: 'mentor-only' | 'shared';
    session: string | null;
    mentee: string | null;
    createdAt: string;
}

export interface ListMaterialsParams {
    session?: string;
    menteeId?: string; // mentor only
    search?: string;
    limit?: number;
}

export type UploadMaterialPayload = {
    title: string;
    description?: string;
    file: File;
    visibility?: 'mentor-only' | 'shared';
    sessionId?: string;
    menteeId?: string;
    tags?: string[];
};

export async function listMaterials(
    params: ListMaterialsParams = {}
): Promise<{ materials: MaterialItem[]; count: number; limit: number }> {
    const { data } = await apiClient.get('/materials', { params });
    // backend returns { success, materials, meta }
    const count = data?.meta?.count ?? data?.materials?.length ?? 0;
    const limit = data?.meta?.limit ?? (params.limit ?? 50);
    return { materials: data.materials || [], count, limit };
}

export async function downloadMaterial(id: string): Promise<void> {
    // Programmatic download to include Authorization header
    const response = await apiClient.get(`/materials/${id}/download`, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Try to infer filename from content-disposition; fallback
    const cd = response.headers['content-disposition'] as string | undefined;
    const filenameMatch = cd && /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
    const name = filenameMatch ? decodeURIComponent(filenameMatch[1] || filenameMatch[2]) : 'material';
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export async function uploadMaterial(payload: UploadMaterialPayload): Promise<{ id: string; title: string }> {
    const formData = new FormData();
    formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    formData.append('file', payload.file);
    if (payload.visibility) formData.append('visibility', payload.visibility);
    if (payload.sessionId) formData.append('sessionId', payload.sessionId);
    if (payload.menteeId) formData.append('menteeId', payload.menteeId);
    if (payload.tags && payload.tags.length) {
        payload.tags.forEach((tag) => formData.append('tags[]', tag));
    }

    const { data } = await apiClient.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

    const material = data?.material || {};
    return {
        id: material.id ?? '',
        title: material.title ?? payload.title
    };
}
