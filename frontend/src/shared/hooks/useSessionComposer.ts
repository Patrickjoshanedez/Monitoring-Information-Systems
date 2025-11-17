import type { AvailabilityFilters, SessionComposerState } from '../stores/sessionComposerStore';
import { useSessionComposerStore } from '../stores/sessionComposerStore';

export const useSessionComposer = <T>(
    selector: (state: SessionComposerState) => T,
    equalityFn?: (a: T, b: T) => boolean
) => (equalityFn ? useSessionComposerStore(selector, equalityFn) : useSessionComposerStore(selector));

export const useSessionComposerActions = () =>
    useSessionComposerStore((state) => ({
        setMentorId: state.setMentorId,
        setMenteeId: state.setMenteeId,
        setSlot: state.setSlot,
        setLock: state.setLock,
        setDetails: state.setDetails,
        setFilters: state.setFilters,
        reset: state.reset,
        composeBookingPayload: state.composeBookingPayload,
    }));

export const useSessionFilters = (): AvailabilityFilters => useSessionComposerStore((state) => state.filters);

export const useBookingPayloadPreview = () => useSessionComposerStore((state) => state.composeBookingPayload());

export { useSessionComposerStore };
