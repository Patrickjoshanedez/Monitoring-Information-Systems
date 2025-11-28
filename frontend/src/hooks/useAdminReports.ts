import { useQuery } from '@tanstack/react-query';
import {
    AdminReportFilters,
    AdminReportOverview,
    fetchAdminReportOverview,
} from '../shared/services/reportService';

export const ADMIN_REPORT_QUERY_KEY = ['admin', 'report', 'overview'] as const;

export const useAdminReportOverview = (filters: AdminReportFilters, options?: { enabled?: boolean }) => {
    return useQuery<AdminReportOverview>({
        queryKey: [...ADMIN_REPORT_QUERY_KEY, filters],
        queryFn: () => fetchAdminReportOverview(filters),
        keepPreviousData: true,
        enabled: options?.enabled ?? true,
        staleTime: 60 * 1000,
    });
};
