import React, { useEffect, useState } from 'react';
import type { SessionParticipant } from '../../shared/services/sessionsService';
import type { AttendancePayload, AttendanceEntryPayload } from '../../shared/services/sessionsService';
import { useRecordSessionAttendance } from '../../shared/hooks/useSessionLifecycle';

type Props = {
    open: boolean;
    onClose: () => void;
    sessionId: string;
    participants: SessionParticipant[]; // at least one participant (mentee or list)
};

const AttendanceRow: React.FC<{
    participant: SessionParticipant;
    value: string;
    onChange: (val: string) => void;
}> = ({ participant, value, onChange }) => {
    return (
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-py-2 tw-border-b tw-border-gray-100">
            <div className="tw-flex tw-items-center tw-gap-3">
                <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-gray-100 tw-flex tw-items-center tw-justify-center tw-text-sm tw-font-semibold">
                    {participant.name?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="tw-text-sm tw-font-medium tw-text-gray-900">{participant.name}</div>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
                <select
                    value={value}
                    aria-label={`attendance-${participant.id}`}
                    onChange={(e) => onChange(e.target.value)}
                    className="tw-px-3 tw-py-2 tw-border tw-border-gray-200 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                </select>
            </div>
        </div>
    );
};

const AttendanceModal: React.FC<Props> = ({ open, onClose, sessionId, participants }) => {
    const [localEntries, setLocalEntries] = useState<Record<string, string>>({});
    const [notesMap, setNotesMap] = useState<Record<string, string>>({});

    const recordAttendance = useRecordSessionAttendance();

    useEffect(() => {
        if (open && participants) {
            // initial state: default present for all
            const init: Record<string, string> = {};
            participants.forEach((p) => (init[p.id ?? ''] = 'present'));
            setLocalEntries(init);
            setNotesMap({});
        }
    }, [open, participants]);

    const setStatus = (id: string, value: string) => {
        setLocalEntries((s) => ({ ...s, [id]: value }));
    };

    const setNote = (id: string, value: string) => {
        setNotesMap((s) => ({ ...s, [id]: value }));
    };

    const handleSubmit = async (ev?: React.FormEvent) => {
        ev?.preventDefault();
        const attendance: AttendanceEntryPayload[] = participants
            .map((p) => ({ userId: p.id ?? '', status: (localEntries[p.id ?? ''] || 'present') as any, note: notesMap[p.id ?? ''] }))
            .filter((e) => e.userId);

        try {
            await recordAttendance.mutateAsync({ sessionId, payload: { attendance } as AttendancePayload });
            onClose();
        } catch (err) {
            // show error inline; fallback to console
            // keep UI simple — MentorSessionsManager will display banner on success
            // eslint-disable-next-line no-console
            console.error('attendance save failed', err);
        }
    };

    if (!open) return null;

    return (
        <div role="dialog" aria-modal="true" className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-p-4">
            <form onSubmit={handleSubmit} className="tw-w-full tw-max-w-2xl tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-mb-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Record attendance</h3>
                    <button type="button" onClick={onClose} aria-label="Close" className="tw-text-sm tw-text-gray-500 hover:tw-text-gray-700">Close</button>
                </div>

                <div className="tw-space-y-3 tw-max-h-[48vh] tw-overflow-y-auto tw-mb-4">
                    {participants.length === 0 && <div className="tw-text-sm tw-text-gray-500">No participants available</div>}
                    {participants.map((p) => (
                        <div key={`${sessionId}-${p.id}`}>
                            <AttendanceRow participant={p} value={localEntries[p.id ?? ''] ?? 'present'} onChange={(val) => setStatus(p.id ?? '', val)} />
                            <textarea
                                value={notesMap[p.id ?? ''] ?? ''}
                                onChange={(e) => setNote(p.id ?? '', e.target.value)}
                                placeholder="Optional note (max 280 characters)"
                                maxLength={280}
                                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-200 tw-rounded-md tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary tw-mt-2"
                                aria-label={`note-${p.id}`}
                            />
                        </div>
                    ))}
                </div>

                <div className="tw-flex tw-justify-end tw-gap-3">
                    <button type="button" onClick={onClose} className="tw-px-4 tw-py-2 tw-text-sm tw-border tw-rounded-lg tw-border-gray-200 hover:tw-bg-gray-50">Cancel</button>
                    <button type="submit" disabled={recordAttendance.isLoading} className="tw-bg-primary tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm hover:tw-bg-primary/90">
                        {recordAttendance.isLoading ? 'Saving...' : 'Save attendance'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default React.memo(AttendanceModal);
