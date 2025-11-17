import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AvailabilitySlot } from '../services/availabilityService';
import type { BookSessionPayload, BookingLockResult } from '../services/sessionsService';

export interface AvailabilityFilters {
    from?: string;
    to?: string;
    includeInactive: boolean;
    timezone?: string;
}

export interface SessionComposerState {
    mentorId?: string;
    menteeId?: string;
    subject: string;
    durationMinutes: number;
    scheduledAt?: string;
    notes?: string;
    slot?: AvailabilitySlot;
    lock: BookingLockResult | null;
    filters: AvailabilityFilters;
    setMentorId: (mentorId?: string) => void;
    setMenteeId: (menteeId?: string) => void;
    setSlot: (slot?: AvailabilitySlot) => void;
    setLock: (lock: BookingLockResult | null) => void;
    setDetails: (details: Partial<Pick<SessionComposerState, 'subject' | 'durationMinutes' | 'scheduledAt' | 'notes'>>) => void;
    setFilters: (filters: Partial<AvailabilityFilters>) => void;
    reset: () => void;
    composeBookingPayload: (overrides?: Partial<BookSessionPayload>) => BookSessionPayload | null;
}

const INITIAL_STATE: Omit<SessionComposerState, 'setMentorId' | 'setMenteeId' | 'setSlot' | 'setLock' | 'setDetails' | 'setFilters' | 'reset' | 'composeBookingPayload'> = {
    subject: '',
    durationMinutes: 60,
    filters: {
        includeInactive: false,
        timezone: undefined,
        from: undefined,
        to: undefined,
    },
    lock: null,
    mentorId: undefined,
    menteeId: undefined,
    scheduledAt: undefined,
    notes: undefined,
    slot: undefined,
};

export const useSessionComposerStore = create<SessionComposerState>()(
    devtools((set, get) => ({
        ...INITIAL_STATE,
        setMentorId: (mentorId) =>
            set((state) => ({
                mentorId,
                slot: mentorId && mentorId === state.mentorId ? state.slot : undefined,
                scheduledAt: mentorId && mentorId === state.mentorId ? state.scheduledAt : undefined,
                lock: mentorId && mentorId === state.mentorId ? state.lock : null,
            })),
        setMenteeId: (menteeId) => set({ menteeId }),
        setSlot: (slot) =>
            set((state) => ({
                slot,
                scheduledAt: slot?.start ?? state.scheduledAt,
                lock: slot ? state.lock : null,
            })),
        setLock: (lock) => set({ lock }),
    setDetails: (details) => set(details as Partial<SessionComposerState>),
        setFilters: (filters) =>
            set((state) => ({
                filters: {
                    ...state.filters,
                    ...filters,
                },
            })),
        reset: () => set({ ...INITIAL_STATE }),
        composeBookingPayload: (overrides) => {
            const { mentorId, subject, durationMinutes, scheduledAt, slot, lock } = get();
            const scheduled = scheduledAt ?? slot?.start;
            if (!mentorId || !scheduled) {
                return null;
            }

            const basePayload: BookSessionPayload = {
                mentorId,
                subject: subject || 'Mentorship Session',
                scheduledAt: scheduled,
                durationMinutes,
                availabilityRef: slot?.availabilityId,
                lockId: lock?.lockId,
            };

            return {
                ...basePayload,
                ...overrides,
            };
        },
    }), { name: 'session-composer-store' })
);
