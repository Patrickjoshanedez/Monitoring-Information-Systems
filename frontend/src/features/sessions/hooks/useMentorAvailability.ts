import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AvailabilityPayload,
    AvailabilityQueryParams,
    AvailabilitySlot,
    createMentorAvailability,
    deleteMentorAvailability,
    fetchMentorAvailability,
    updateMentorAvailability,
} from '../../../shared/services/availabilityService';

export type AvailabilityRangeInput = Omit<AvailabilityQueryParams, 'from' | 'to'> & {
    from?: string | Date;
    to?: string | Date;
};

type AvailabilityRangeLike = AvailabilityRangeInput | AvailabilityQueryParams;

const normalizeRangeValue = (value?: string | Date): string | undefined => {
    if (!value) {
        return undefined;
    }
    if (typeof value === 'string') {
        return value;
    }
    return value.toISOString();
};

const toQueryParams = (params?: AvailabilityRangeLike): AvailabilityQueryParams | undefined => {
    if (!params) {
        return undefined;
    }
    const normalized: AvailabilityQueryParams = {};
    const from = normalizeRangeValue(params.from);
    const to = normalizeRangeValue(params.to);
    if (from) normalized.from = from;
    if (to) normalized.to = to;
    if (typeof params.includeInactive !== 'undefined') {
        normalized.includeInactive = params.includeInactive;
    }
    return normalized;
};

const baseAvailabilityKey = ['mentor-availability'] as const;

export const mentorAvailabilityKey = (mentorId: string, params?: AvailabilityRangeLike) => {
    const normalized = toQueryParams(params);
    return [
        ...baseAvailabilityKey,
        mentorId,
        normalized?.from ?? 'auto-from',
        normalized?.to ?? 'auto-to',
        normalized?.includeInactive ? 'with-inactive' : 'active-only',
    ];
};

const invalidateMentorAvailability = (queryClient: ReturnType<typeof useQueryClient>, mentorId: string) => {
    queryClient.invalidateQueries({ queryKey: [...baseAvailabilityKey, mentorId], exact: false });
};

export const useMentorAvailability = (
    mentorId?: string,
    params?: AvailabilityRangeInput,
    options?: { enabled?: boolean }
) => {
    const normalizedParams = useMemo(() => toQueryParams(params), [params?.from, params?.to, params?.includeInactive]);
    const query = useQuery({
        queryKey: mentorId
            ? mentorAvailabilityKey(mentorId, normalizedParams ?? params)
            : [...baseAvailabilityKey, 'missing-mentor'],
        enabled: Boolean(mentorId) && (options?.enabled ?? true),
        staleTime: 60_000,
        keepPreviousData: true,
        queryFn: () => fetchMentorAvailability(mentorId!, normalizedParams),
    });

    const availability = query.data?.availability ?? [];
    const slots = query.data?.slots ?? [];
    const slotMap = useMemo(() => {
        return slots.reduce<Map<string, AvailabilitySlot>>((map, slot) => {
            map.set(slot.slotId, slot);
            return map;
        }, new Map());
    }, [slots]);

    return {
        ...query,
        availability,
        slots,
        slotMap,
    };
};

export const useCreateAvailability = (mentorId?: string) => {
    const queryClient = useQueryClient();
    return useMutation(
        (payload: AvailabilityPayload) => {
            if (!mentorId) {
                return Promise.reject(new Error('mentorId is required to create availability'));
            }
            return createMentorAvailability(mentorId, payload);
        },
        {
            onSettled: () => {
                if (mentorId) {
                    invalidateMentorAvailability(queryClient, mentorId);
                }
            },
        }
    );
};

export const useUpdateAvailability = (mentorId?: string) => {
    const queryClient = useQueryClient();
    return useMutation(
        ({ availabilityId, payload }: { availabilityId: string; payload: AvailabilityPayload }) => {
            if (!mentorId) {
                return Promise.reject(new Error('mentorId is required to update availability'));
            }
            return updateMentorAvailability(mentorId, availabilityId, payload);
        },
        {
            onSettled: () => {
                if (mentorId) {
                    invalidateMentorAvailability(queryClient, mentorId);
                }
            },
        }
    );
};

export const useDeleteAvailability = (mentorId?: string) => {
    const queryClient = useQueryClient();
    return useMutation(
        (availabilityId: string) => {
            if (!mentorId) {
                return Promise.reject(new Error('mentorId is required to delete availability'));
            }
            return deleteMentorAvailability(mentorId, availabilityId);
        },
        {
            onSettled: () => {
                if (mentorId) {
                    invalidateMentorAvailability(queryClient, mentorId);
                }
            },
        }
    );
};
