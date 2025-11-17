import React, { useEffect, useMemo, useState } from 'react';
import {
    AvailabilityEntry,
    AvailabilityPayload,
    OneOffAvailabilitySlot,
    RecurringAvailabilityRule,
} from '../../../shared/services/availabilityService';

const DAY_OPTIONS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const TIMEZONE_SUGGESTIONS = [
    'UTC',
    'Asia/Manila',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Europe/London',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Australia/Sydney',
];

type RecurringRuleDraft = {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
};

type OneOffSlotDraft = {
    start: string;
    end: string;
};

export type AvailabilityFormMode = 'create' | 'edit';

export interface AvailabilityFormProps {
    mode: AvailabilityFormMode;
    initialEntry?: AvailabilityEntry | null;
    defaultTimezone: string;
    onSubmit: (payload: AvailabilityPayload) => Promise<void> | void;
    onCancel?: () => void;
    isSubmitting?: boolean;
}

const defaultRecurringRule = (): RecurringRuleDraft => ({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
});

const defaultOneOffSlot = (): OneOffSlotDraft => ({
    start: '',
    end: '',
});

const toIsoString = (value: string): string | null => {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
};

const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
    mode,
    initialEntry,
    defaultTimezone,
    onSubmit,
    onCancel,
    isSubmitting,
}) => {
    const resolvedTimezone = useMemo(() => {
        if (initialEntry?.timezone) {
            return initialEntry.timezone;
        }
        return defaultTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }, [defaultTimezone, initialEntry?.timezone]);

    const [type, setType] = useState<'recurring' | 'oneoff'>(initialEntry?.type || 'recurring');
    const [timezone, setTimezone] = useState(resolvedTimezone);
    const [capacity, setCapacity] = useState(String(initialEntry?.capacity ?? 1));
    const [note, setNote] = useState(initialEntry?.note ?? '');
    const [recurringRules, setRecurringRules] = useState<RecurringRuleDraft[]>(() => {
        if (initialEntry?.type === 'recurring' && initialEntry.recurring?.length) {
            return initialEntry.recurring.map((rule) => ({
                dayOfWeek: rule.dayOfWeek,
                startTime: rule.startTime,
                endTime: rule.endTime,
            }));
        }
        return [defaultRecurringRule()];
    });
    const [oneOffSlots, setOneOffSlots] = useState<OneOffSlotDraft[]>(() => {
        if (initialEntry?.type === 'oneoff' && initialEntry.oneOff?.length) {
            return initialEntry.oneOff.map((slot) => ({
                start: slot.start ? slot.start.slice(0, 16) : '',
                end: slot.end ? slot.end.slice(0, 16) : '',
            }));
        }
        return [defaultOneOffSlot()];
    });
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!initialEntry) {
            return;
        }
        setType(initialEntry.type);
        setTimezone(initialEntry.timezone || resolvedTimezone);
        setCapacity(String(initialEntry.capacity ?? 1));
        setNote(initialEntry.note ?? '');
        if (initialEntry.type === 'recurring') {
            setRecurringRules(
                initialEntry.recurring?.length
                    ? initialEntry.recurring.map((rule) => ({
                          dayOfWeek: rule.dayOfWeek,
                          startTime: rule.startTime,
                          endTime: rule.endTime,
                      }))
                    : [defaultRecurringRule()]
            );
        } else {
            setOneOffSlots(
                initialEntry.oneOff?.length
                    ? initialEntry.oneOff.map((slot) => ({
                          start: slot.start ? slot.start.slice(0, 16) : '',
                          end: slot.end ? slot.end.slice(0, 16) : '',
                      }))
                    : [defaultOneOffSlot()]
            );
        }
    }, [initialEntry, resolvedTimezone]);

    const resetFormError = () => setFormError(null);

    const handleAddRecurringRule = () => {
        setRecurringRules((prev) => [...prev, defaultRecurringRule()]);
    };

    const handleRecurringChange = (index: number, key: keyof RecurringRuleDraft, value: string) => {
        resetFormError();
        setRecurringRules((prev) =>
            prev.map((rule, idx) => (idx === index ? { ...rule, [key]: key === 'dayOfWeek' ? Number(value) : value } : rule))
        );
    };

    const handleRemoveRecurringRule = (index: number) => {
        setRecurringRules((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
    };

    const handleAddOneOffSlot = () => {
        setOneOffSlots((prev) => [...prev, defaultOneOffSlot()]);
    };

    const handleOneOffChange = (index: number, key: keyof OneOffSlotDraft, value: string) => {
        resetFormError();
        setOneOffSlots((prev) => prev.map((slot, idx) => (idx === index ? { ...slot, [key]: value } : slot)));
    };

    const handleRemoveOneOffSlot = (index: number) => {
        setOneOffSlots((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
    };

    const validateRecurring = (): string | null => {
        if (!recurringRules.length) {
            return 'Add at least one recurring rule.';
        }
        for (const rule of recurringRules) {
            if (rule.startTime >= rule.endTime) {
                return 'Start time must be earlier than end time.';
            }
        }
        return null;
    };

    const validateOneOff = (): string | null => {
        if (!oneOffSlots.length) {
            return 'Add at least one one-off slot.';
        }
        for (const slot of oneOffSlots) {
            if (!slot.start || !slot.end) {
                return 'Each slot needs a start and end time.';
            }
            const startIso = toIsoString(slot.start);
            const endIso = toIsoString(slot.end);
            if (!startIso || !endIso) {
                return 'Provide valid date values.';
            }
            if (startIso >= endIso) {
                return 'Slot start must be earlier than end.';
            }
        }
        return null;
    };

    const buildPayload = (): AvailabilityPayload | null => {
        const numericCapacity = Number(capacity) || 1;
        if (numericCapacity <= 0) {
            setFormError('Capacity must be at least 1.');
            return null;
        }
        if (!timezone.trim()) {
            setFormError('Provide a valid timezone (e.g., Asia/Manila).');
            return null;
        }
        if (type === 'recurring') {
            const error = validateRecurring();
            if (error) {
                setFormError(error);
                return null;
            }
            const recurringRulesPayload: RecurringAvailabilityRule[] = recurringRules.map((rule) => ({
                dayOfWeek: rule.dayOfWeek,
                startTime: rule.startTime,
                endTime: rule.endTime,
                timezone: timezone.trim(),
            }));
            return {
                type: 'recurring',
                timezone: timezone.trim(),
                capacity: numericCapacity,
                note: note.trim() ? note.trim() : null,
                recurring: recurringRulesPayload,
            };
        }
        const error = validateOneOff();
        if (error) {
            setFormError(error);
            return null;
        }
        const oneOffPayload: OneOffAvailabilitySlot[] = oneOffSlots.map((slot) => ({
            start: toIsoString(slot.start)!,
            end: toIsoString(slot.end)!,
            timezone: timezone.trim(),
        }));
        return {
            type: 'oneoff',
            timezone: timezone.trim(),
            capacity: numericCapacity,
            note: note.trim() ? note.trim() : null,
            oneOff: oneOffPayload,
        };
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormError(null);
        const payload = buildPayload();
        if (!payload) {
            return;
        }
        try {
            await onSubmit(payload);
        } catch (error) {
            setFormError((error as Error)?.message || 'Unable to save availability.');
        }
    };

    const timezoneInputId = useMemo(() => `availability-timezone-${mode}`, [mode]);

    return (
        <form onSubmit={handleSubmit} className="tw-space-y-5" aria-live="polite">
            <div className="tw-flex tw-flex-wrap tw-gap-2" role="group" aria-label="Availability type selector">
                <button
                    type="button"
                    onClick={() => (mode === 'edit' ? null : setType('recurring'))}
                    className={`tw-flex-1 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-sm tw-font-semibold ${
                        type === 'recurring'
                            ? 'tw-bg-primary tw-text-white tw-border-primary'
                            : 'tw-bg-white tw-text-gray-700 tw-border-gray-200 hover:tw-bg-gray-50'
                    } ${mode === 'edit' && initialEntry?.type !== 'recurring' ? 'tw-opacity-60 tw-cursor-not-allowed' : ''}`}
                    aria-pressed={type === 'recurring' ? 'true' : 'false'}
                    disabled={mode === 'edit' && initialEntry?.type !== 'recurring'}
                >
                    Weekly recurring slots
                </button>
                <button
                    type="button"
                    onClick={() => (mode === 'edit' ? null : setType('oneoff'))}
                    className={`tw-flex-1 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-sm tw-font-semibold ${
                        type === 'oneoff'
                            ? 'tw-bg-primary tw-text-white tw-border-primary'
                            : 'tw-bg-white tw-text-gray-700 tw-border-gray-200 hover:tw-bg-gray-50'
                    } ${mode === 'edit' && initialEntry?.type !== 'oneoff' ? 'tw-opacity-60 tw-cursor-not-allowed' : ''}`}
                    aria-pressed={type === 'oneoff' ? 'true' : 'false'}
                    disabled={mode === 'edit' && initialEntry?.type !== 'oneoff'}
                >
                    One-off window
                </button>
            </div>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                <label className="tw-flex tw-flex-col tw-gap-1">
                    <span className="tw-text-sm tw-font-medium tw-text-gray-700">Timezone</span>
                    <input
                        id={timezoneInputId}
                        type="text"
                        list="timezone-suggestions"
                        value={timezone}
                        onChange={(event) => {
                            resetFormError();
                            setTimezone(event.target.value);
                        }}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary"
                        placeholder="Asia/Manila"
                        required
                    />
                </label>
                <label className="tw-flex tw-flex-col tw-gap-1">
                    <span className="tw-text-sm tw-font-medium tw-text-gray-700">Capacity per slot</span>
                    <input
                        type="number"
                        min={1}
                        value={capacity}
                        onChange={(event) => {
                            resetFormError();
                            setCapacity(event.target.value);
                        }}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary"
                        required
                    />
                </label>
            </div>

            <label className="tw-flex tw-flex-col tw-gap-1">
                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Internal note (optional)</span>
                <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary"
                    placeholder="Displayed internally to help you remember context"
                />
            </label>

            {type === 'recurring' ? (
                <div className="tw-space-y-3">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Weekly rules</p>
                        <button
                            type="button"
                            onClick={handleAddRecurringRule}
                            className="tw-text-sm tw-font-medium tw-text-primary hover:tw-text-primary/80"
                        >
                            + Add rule
                        </button>
                    </div>
                    <div className="tw-space-y-3">
                        {recurringRules.map((rule, index) => (
                            <div
                                key={`recurring-${index}`}
                                className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-3 tw-p-3 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-gray-50"
                            >
                                <label className="tw-flex tw-flex-col tw-gap-1">
                                    <span className="tw-text-xs tw-font-medium tw-text-gray-600">Day</span>
                                    <select
                                        value={rule.dayOfWeek}
                                        onChange={(event) => handleRecurringChange(index, 'dayOfWeek', event.target.value)}
                                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary"
                                    >
                                        {DAY_OPTIONS.map((day) => (
                                            <option key={day.value} value={day.value}>
                                                {day.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="tw-flex tw-flex-col tw-gap-1">
                                    <span className="tw-text-xs tw-font-medium tw-text-gray-600">Start time</span>
                                    <input
                                        type="time"
                                        value={rule.startTime}
                                        onChange={(event) => handleRecurringChange(index, 'startTime', event.target.value)}
                                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary"
                                    />
                                </label>
                                <label className="tw-flex tw-flex-col tw-gap-1">
                                    <span className="tw-text-xs tw-font-medium tw-text-gray-600">End time</span>
                                    <input
                                        type="time"
                                        value={rule.endTime}
                                        onChange={(event) => handleRecurringChange(index, 'endTime', event.target.value)}
                                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary"
                                    />
                                </label>
                                <div className="tw-flex tw-items-end">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRecurringRule(index)}
                                        className="tw-text-sm tw-font-semibold tw-text-red-600 hover:tw-text-red-700 tw-w-full tw-rounded-lg tw-border tw-border-red-100 tw-bg-red-50 tw-py-2"
                                        disabled={recurringRules.length === 1}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="tw-space-y-3">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <p className="tw-text-sm tw-font-semibold tw-text-gray-900">One-off slots</p>
                        <button
                            type="button"
                            onClick={handleAddOneOffSlot}
                            className="tw-text-sm tw-font-medium tw-text-primary hover:tw-text-primary/80"
                        >
                            + Add slot
                        </button>
                    </div>
                    <div className="tw-space-y-3">
                        {oneOffSlots.map((slot, index) => (
                            <div
                                key={`oneoff-${index}`}
                                className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3 tw-p-3 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-gray-50"
                            >
                                <label className="tw-flex tw-flex-col tw-gap-1">
                                    <span className="tw-text-xs tw-font-medium tw-text-gray-600">Start</span>
                                    <input
                                        type="datetime-local"
                                        value={slot.start}
                                        onChange={(event) => handleOneOffChange(index, 'start', event.target.value)}
                                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary"
                                        required
                                    />
                                </label>
                                <label className="tw-flex tw-flex-col tw-gap-1">
                                    <span className="tw-text-xs tw-font-medium tw-text-gray-600">End</span>
                                    <input
                                        type="datetime-local"
                                        value={slot.end}
                                        onChange={(event) => handleOneOffChange(index, 'end', event.target.value)}
                                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary"
                                        required
                                    />
                                </label>
                                <div className="tw-flex tw-items-center md:tw-col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOneOffSlot(index)}
                                        className="tw-text-sm tw-font-semibold tw-text-red-600 hover:tw-text-red-700 tw-w-full tw-rounded-lg tw-border tw-border-red-100 tw-bg-red-50 tw-py-2"
                                        disabled={oneOffSlots.length === 1}
                                    >
                                        Remove slot
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {formError ? (
                <p className="tw-text-sm tw-font-medium tw-text-red-600" role="alert">
                    {formError}
                </p>
            ) : null}

            <div className="tw-flex tw-flex-wrap tw-justify-end tw-gap-3">
                {onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-700 hover:tw-bg-gray-50"
                    >
                        Cancel
                    </button>
                ) : null}
                <button
                    type="submit"
                    className="tw-rounded-lg tw-bg-primary tw-text-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold hover:tw-bg-primary/90 disabled:tw-opacity-60"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving…' : mode === 'create' ? 'Publish availability' : 'Update availability'}
                </button>
            </div>

            <datalist id="timezone-suggestions">
                {TIMEZONE_SUGGESTIONS.map((tz) => (
                    <option key={tz} value={tz} />
                ))}
            </datalist>
        </form>
    );
};

export default AvailabilityForm;
