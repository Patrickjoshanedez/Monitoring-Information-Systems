import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchCertificates,
    fetchAchievements,
    requestCertificateIssue,
    requestCertificateReissue,
    IssueCertificatePayload,
    CertificateScope,
} from '../shared/services/certificatesService';

export const certificateQueryKey = (scope: CertificateScope) => ['certificates', scope] as const;
export const achievementsQueryKey = ['achievements', 'mentee'] as const;

export const useCertificates = (scope: CertificateScope = 'mentee') =>
    useQuery(certificateQueryKey(scope), () => fetchCertificates(scope), {
        staleTime: 60_000,
    });

export const useAchievements = () =>
    useQuery(achievementsQueryKey, fetchAchievements, {
        staleTime: 60_000,
    });

export const useIssueCertificate = (scope: CertificateScope = 'mentee') => {
    const queryClient = useQueryClient();
    return useMutation((payload: IssueCertificatePayload) => requestCertificateIssue(payload), {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: certificateQueryKey(scope) });
        },
    });
};

export const useRequestCertificateReissue = () => {
    const queryClient = useQueryClient();
    return useMutation(({ certificateId, reason }: { certificateId: string; reason?: string }) => requestCertificateReissue(certificateId, reason), {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: certificateQueryKey('mentee') });
        },
    });
};
