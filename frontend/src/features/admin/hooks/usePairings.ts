import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchPairingDetail,
    fetchPairings,
    PairingFilters,
    PairingRecord,
    PairingStatus,
    updatePairing,
} from '../services/pairingsApi';

const listKey = ['admin', 'matching', 'pairings'];
const detailKey = (pairingId?: string) => ['admin', 'matching', 'pairing', pairingId];

export const usePairings = (filters: PairingFilters) => {
    return useQuery({
        queryKey: [...listKey, filters],
        queryFn: () => fetchPairings(filters),
        keepPreviousData: true,
    });
};

export const usePairingDetail = (pairingId?: string) => {
    return useQuery({
        queryKey: detailKey(pairingId),
        queryFn: () => fetchPairingDetail(pairingId as string),
        enabled: Boolean(pairingId),
    });
};

export const useUpdatePairing = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pairingId,
            payload,
        }: {
            pairingId: string;
            payload: Partial<{ status: PairingStatus; notes: string | null; goals: string | null; program: string | null; reason?: string }>;
        }) => updatePairing(pairingId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: listKey });
            queryClient.invalidateQueries({ queryKey: detailKey(variables.pairingId) });
        },
    });
};

export type { PairingFilters, PairingRecord, PairingStatus };
