import { apiClient } from '../config/apiClient';

export interface RecurringAvailabilityRule {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
}

export interface OneOffAvailabilitySlot {
    start: string;
    end: string;
    timezone: string;
}

export interface AvailabilityEntry {
    id: string;
    mentor: string;
    type: 'recurring' | 'oneoff';
    timezone: string;
    capacity: number;
    note?: string | null;
    active: boolean;
    recurring?: RecurringAvailabilityRule[];
    oneOff?: OneOffAvailabilitySlot[];
    createdAt?: string;
    updatedAt?: string;
}

export interface AvailabilitySlot {
    slotId: string;
    availabilityId: string;
    start: string;
    end: string;
    timezone: string;
    capacity: number;
    booked: number;
    remaining: number;
    note?: string | null;
    type: 'recurring' | 'oneoff';
    rule?: RecurringAvailabilityRule;
}

export interface AvailabilityQueryParams {
    from?: string;
    to?: string;
    includeInactive?: boolean;
}

export type RecurringAvailabilityPayload = {
    type: 'recurring';
    timezone?: string;
    capacity?: number;
    note?: string | null;
    recurring: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        timezone?: string;
    }>;
};

export type OneOffAvailabilityPayload = {
    type: 'oneoff';
    timezone?: string;
    capacity?: number;
    note?: string | null;
    oneOff: Array<{
        start: string;
        end: string;
        timezone?: string;
    }>;
};

export type AvailabilityPayload = RecurringAvailabilityPayload | OneOffAvailabilityPayload;

interface AvailabilityApiResponse {
    success: boolean;
    availability: AvailabilityEntry[];
    slots: AvailabilitySlot[];
}

const toIsoString = (value: unknown): string => {
    if (!value) {
        return new Date().toISOString();
    }
    if (typeof value === 'string') {
        return value;
    }
    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString();
    }
    return date.toISOString();
};

const normalizeId = (value: any): string => {
    if (!value) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object' && value !== null) {
        if (typeof value.toString === 'function') {
            return value.toString();
        }
        if (value._id) {
            return value._id.toString();
        }
        if (value.id) {
            return value.id.toString();
        }
    }
    return String(value);
};

const mapRecurringRule = (rule: any): RecurringAvailabilityRule => ({
    dayOfWeek: Number.isFinite(rule?.dayOfWeek) ? Number(rule.dayOfWeek) : 0,
    startTime: rule?.startTime || '09:00',
    endTime: rule?.endTime || '10:00',
    timezone: rule?.timezone || 'UTC',
});

const mapOneOffSlot = (slot: any): OneOffAvailabilitySlot => ({
    start: toIsoString(slot?.start),
    end: toIsoString(slot?.end),
    timezone: slot?.timezone || 'UTC',
});

const mapAvailabilityEntry = (entry: any): AvailabilityEntry => ({
    id: normalizeId(entry?._id ?? entry?.id ?? entry),
    mentor: normalizeId(entry?.mentor ?? ''),
    type: entry?.type === 'oneoff' ? 'oneoff' : 'recurring',
    timezone: entry?.timezone || 'UTC',
    capacity: typeof entry?.capacity === 'number' ? entry.capacity : 1,
    note: typeof entry?.note === 'string' ? entry.note : null,
    active: entry?.active !== false,
    recurring: Array.isArray(entry?.recurring) ? entry.recurring.map(mapRecurringRule) : undefined,
    oneOff: Array.isArray(entry?.oneOff) ? entry.oneOff.map(mapOneOffSlot) : undefined,
    createdAt: entry?.createdAt,
    updatedAt: entry?.updatedAt,
});

const mapAvailabilitySlot = (slot: any): AvailabilitySlot => {
    const availabilityId = normalizeId(slot?.availabilityId ?? slot?.availability);
    const computedSlotId = slot?.slotId || `${availabilityId}:${toIsoString(slot?.start)}`;
    const capacity = typeof slot?.capacity === 'number' ? slot.capacity : 1;
    const booked = typeof slot?.booked === 'number' ? slot.booked : 0;
    const remaining = typeof slot?.remaining === 'number' ? slot.remaining : Math.max(0, capacity - booked);

    return {
        slotId: computedSlotId,
        availabilityId,
        start: toIsoString(slot?.start),
        end: toIsoString(slot?.end),
        timezone: slot?.timezone || 'UTC',
        capacity,
        booked,
        remaining,
        note: typeof slot?.note === 'string' ? slot.note : null,
        type: slot?.type === 'oneoff' ? 'oneoff' : 'recurring',
        rule: slot?.rule ? mapRecurringRule(slot.rule) : undefined,
    };
};

export const fetchMentorAvailability = async (
    mentorId: string,
    params?: AvailabilityQueryParams
): Promise<{ availability: AvailabilityEntry[]; slots: AvailabilitySlot[] }> => {
    const { data } = await apiClient.get<AvailabilityApiResponse>(`/mentors/${mentorId}/availability`, {
        params,
    });

    return {
        availability: Array.isArray(data.availability) ? data.availability.map(mapAvailabilityEntry) : [],
        slots: Array.isArray(data.slots) ? data.slots.map(mapAvailabilitySlot) : [],
    };
};

export const createMentorAvailability = async (
    mentorId: string,
    payload: AvailabilityPayload
): Promise<AvailabilityEntry> => {
    const { data } = await apiClient.post<{ success: boolean; availability: AvailabilityEntry }>(
        `/mentors/${mentorId}/availability`,
        payload
    );

    return mapAvailabilityEntry(data.availability);
};

export const updateMentorAvailability = async (
    mentorId: string,
    availabilityId: string,
    payload: AvailabilityPayload
): Promise<AvailabilityEntry> => {
    const { data } = await apiClient.patch<{ success: boolean; availability: AvailabilityEntry }>(
        `/mentors/${mentorId}/availability/${availabilityId}`,
        payload
    );

    return mapAvailabilityEntry(data.availability);
};

export const deleteMentorAvailability = async (
    mentorId: string,
    availabilityId: string
): Promise<AvailabilityEntry> => {
    const { data } = await apiClient.delete<{ success: boolean; availability: AvailabilityEntry }>(
        `/mentors/${mentorId}/availability/${availabilityId}`
    );

    return mapAvailabilityEntry(data.availability);
};
