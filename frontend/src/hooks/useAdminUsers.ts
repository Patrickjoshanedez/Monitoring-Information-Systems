import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/config/apiClient';
import logger from '../shared/utils/logger';

export type AdminActionType = 'approve' | 'reject' | 'deactivate' | 'reactivate' | 'delete';

export interface AdminUserFilters {
    role: 'all' | 'mentor' | 'mentee' | 'admin';
    accountStatus: 'all' | 'active' | 'deactivated' | 'suspended';
    applicationStatus: 'all' | 'pending' | 'approved' | 'rejected';
    pendingOnly: boolean;
    includeDeleted: boolean;
    search: string;
    page: number;
    limit: number;
}

export interface AdminUserListItem {
    id: string;
    firstname?: string;
    lastname?: string;
    displayName?: string;
    email: string;
    role: string;
    accountStatus: string;
    applicationStatus: string;
    applicationRole?: string | null;
    submittedAt?: string | null;
    hasPendingApplication?: boolean;
    profile?: Record<string, unknown> | null;
    lastAction?: {
        id?: string;
        action: string;
        reason?: string | null;
        createdAt?: string;
    } | null;
}

export interface AdminUserDetailResponse {
    user: AdminUserListItem;
    actions: Array<{
        id: string;
        action: string;
        reason?: string | null;
        createdAt?: string;
    }>;
}

export interface AdminUsersResponse {
    users: AdminUserListItem[];
    meta?: {
        pagination?: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

const adminUsersKey = ['admin', 'users'] as const;

const normalizeUser = (user: any): AdminUserListItem => ({
    id: user?.id ?? user?._id ?? '',
    firstname: user?.firstname ?? '',
    lastname: user?.lastname ?? '',
    displayName: user?.displayName ?? user?.profile?.displayName ?? `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim(),
    email: user?.email ?? '',
    role: user?.role ?? 'mentee',
    accountStatus: user?.accountStatus ?? (user?.deletedAt ? 'deactivated' : 'active'),
    applicationStatus: user?.applicationStatus ?? 'not_submitted',
    applicationRole: user?.applicationRole ?? null,
    submittedAt: user?.submittedAt ?? user?.applicationSubmittedAt ?? null,
    hasPendingApplication: Boolean(user?.hasPendingApplication ?? user?.applicationStatus === 'pending'),
    profile: user?.profile ?? null,
    lastAction: user?.lastAction
        ? {
              id: user.lastAction.id ?? user.lastAction._id,
              action: user.lastAction.action,
              reason: user.lastAction.reason,
              createdAt: user.lastAction.createdAt,
          }
        : null,
});

const normalizeUsersResponse = (payload: any): AdminUsersResponse => {
    const source = payload?.users ?? payload?.data?.users ?? [];
    const meta = payload?.meta ?? payload?.data?.meta ?? undefined;
    const users = Array.isArray(source) ? source.map(normalizeUser) : [];
    return { users, meta };
};

const buildFilterParams = (filters: AdminUserFilters) => ({
    ...filters,
    pendingOnly: String(filters.pendingOnly),
    includeDeleted: String(filters.includeDeleted),
});

export const useAdminUsers = (filters: AdminUserFilters) => {
    return useQuery<AdminUsersResponse>({
        queryKey: [...adminUsersKey, filters],
        queryFn: async () => {
            const { data } = await apiClient.get('/admin/users', {
                params: buildFilterParams(filters),
            });
            return normalizeUsersResponse(data);
        },
        keepPreviousData: true,
    });
};

export const useAdminUserDetails = (userId: string | null) => {
    return useQuery<AdminUserDetailResponse>({
        queryKey: [...adminUsersKey, 'detail', userId],
        enabled: Boolean(userId),
        queryFn: async () => {
            if (!userId) {
                return { user: normalizeUser({}), actions: [] };
            }
            const { data } = await apiClient.get(`/admin/users/${userId}`);
            const response = data?.user ? data : data?.data;
            return {
                user: normalizeUser(response?.user ?? {}),
                actions: Array.isArray(response?.actions)
                    ? response.actions.map((action: any, index: number) => ({
                          id: action?.id ?? action?._id ?? `action-${index}`,
                          action: action?.action ?? 'unknown',
                          reason: action?.reason ?? null,
                          createdAt: action?.createdAt,
                      }))
                    : [],
            };
        },
        staleTime: 30_000,
    });
};

export const useAdminUserAction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { userId: string; action: AdminActionType; reason?: string }) => {
            const { userId, action, reason } = payload;
            const { data } = await apiClient.post(`/admin/users/${userId}/actions`, { action, reason });
            return normalizeUser(data?.user ?? data?.data?.user ?? {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminUsersKey });
            queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
        },
        onError: (error: unknown) => {
            logger.error('Admin user action failed', error);
        },
    });
};
