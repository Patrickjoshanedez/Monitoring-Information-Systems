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

export async function listMaterials(params: ListMaterialsParams = {}): Promise<{ materials: MaterialItem[]; count: number; limit: number }>
{
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
