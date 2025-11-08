import { useQuery } from '@tanstack/react-query';
import { listMaterials, ListMaterialsParams, MaterialItem } from '../services/materialsService';

export const materialsQueryKey = (params: ListMaterialsParams = {}) => ['materials', params];

export function useMaterials(params: ListMaterialsParams = {}) {
  return useQuery<{ materials: MaterialItem[]; count: number; limit: number}>(
    materialsQueryKey(params),
    () => listMaterials(params),
    {
      staleTime: 60 * 1000,
      keepPreviousData: true,
    }
  );
}
