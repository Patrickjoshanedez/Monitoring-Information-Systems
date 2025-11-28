import React, { useEffect, useMemo, useState } from 'react';
import { AdminSessionFilters, AdminSessionRecord, useAdminSessions } from '../../hooks/useAdminSessions';
import { useAdminSessionReview } from '../../hooks/useAdminSessionReview';
import { useToast } from '../../hooks/useToast';

type ReviewStatus = 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';

const STATUS_FILTERS: Array<{ label: string; value: AdminSessionFilters['status'] }> = [
    { label: 'All', value: 'all' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_OPTIONS: Array<{ label: string; value: ReviewStatus }> = [
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Rescheduled', value: 'rescheduled' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Completed', value: 'completed' },
];

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '—';
    }
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
};

const formatAttendance = (session: AdminSessionRecord) => {
    const summary = session.attendanceSummary;
    if (!summary) {
        return 'No records';
    }
    const total = summary.total || 0;
    if (total === 0) {
        return 'No records';
    }
    return `${summary.present} / ${total} present`;
};

const AdminSessionTrackerPanel: React.FC = () => {
    const [filters, setFilters] = useState<AdminSessionFilters>({ status: 'all', limit: 10, page: 1, sort: 'newest' });
    const [flaggedOnly, setFlaggedOnly] = useState(false);
    const [selectedSession, setSelectedSession] = useState<AdminSessionRecord | null>(null);
    const [formState, setFormState] = useState({
        status: 'pending' as ReviewStatus,
        flagged: false,
        reason: '',
        notes: '',
    });
    const [formError, setFormError] = useState('');
    const sessionQuery = useAdminSessions(filters);
    const { showToast } = useToast();
    const reviewMutation = useAdminSessionReview();

    const sessions = sessionQuery.data?.sessions ?? [];
    const pagination = sessionQuery.data?.meta?.pagination;
    const filteredSessions = useMemo(() => {
        if (!flaggedOnly) {
            return sessions;
        }
        return sessions.filter((session) => Boolean(session.adminReview?.flagged));
    }, [flaggedOnly, sessions]);

    const currentPage = pagination?.page ?? filters.page ?? 1;
    const totalPages = pagination?.pages ?? 1;

    useEffect(() => {
        if (!selectedSession) {
            setFormState({ status: 'pending', flagged: false, reason: '', notes: '' });
            setFormError('');
            return;
        }
        setFormState({
            status: (selectedSession.status as ReviewStatus) ?? 'pending',
            flagged: Boolean(selectedSession.adminReview?.flagged),
            reason: selectedSession.adminReview?.reason ?? '',
            notes: selectedSession.adminReview?.notes ?? '',
        });
        setFormError('');
    }, [selectedSession]);

    const handleStatusFilterChange = (value: AdminSessionFilters['status']) => {
        setFilters((prev) => ({ ...prev, status: value, page: 1 }));
    };

    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const sort = event.target.value as NonNullable<AdminSessionFilters['sort']>;
        setFilters((prev) => ({ ...prev, sort, page: 1 }));
    };

    const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const limit = Number(event.target.value);
        setFilters((prev) => ({ ...prev, limit, page: 1 }));
    };

    const handlePageChange = (direction: 'prev' | 'next') => {
        setFilters((prev) => {
            const page = prev.page ?? 1;
            if (direction === 'prev') {
                return { ...prev, page: Math.max(1, page - 1) };
            }
            return { ...prev, page: Math.min(totalPages, page + 1) };
        });
    };

    const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedSession) {
            return;
        }
        if (formState.flagged && !formState.reason.trim()) {
            setFormError('Please provide a short reason when flagging a session.');
            return;
        }

        const payload: { sessionId: string; status?: ReviewStatus; flagged?: boolean; reason?: string; notes?: string } = {
            sessionId: selectedSession.id,
        };
        let hasChanges = false;

        if (formState.status && formState.status !== selectedSession.status) {
            payload.status = formState.status;
            hasChanges = true;
        }

        const initialFlagged = Boolean(selectedSession.adminReview?.flagged);
        if (formState.flagged !== initialFlagged) {
            payload.flagged = formState.flagged;
            hasChanges = true;
        }

        const normalizedReason = formState.reason.trim();
        if (normalizedReason !== (selectedSession.adminReview?.reason ?? '')) {
            payload.reason = normalizedReason;
            hasChanges = true;
        }

        const normalizedNotes = formState.notes.trim();
        if (normalizedNotes !== (selectedSession.adminReview?.notes ?? '')) {
            payload.notes = normalizedNotes;
            hasChanges = true;
        }

        if (!hasChanges) {
            setFormError('No changes detected. Update a field before saving.');
            return;
        }

        try {
            await reviewMutation.mutateAsync(payload);
            showToast({ message: 'Session review updated.', variant: 'success' });
            setSelectedSession(null);
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Unable to update session.';
            setFormError(typeof message === 'string' ? message : 'Unable to update session.');
        }
    };

    const renderRows = () => {
        if (sessionQuery.isLoading) {
            return (
                <tr>
                    <td colSpan={6} className="tw-py-10 tw-text-center">
                        <div className="tw-inline-flex tw-items-center tw-gap-2 tw-text-gray-600">
                            <span className="tw-h-5 tw-w-5 tw-animate-spin tw-rounded-full tw-border-b-2 tw-border-purple-500" aria-hidden="true" />
                            Loading sessions…
                        </div>
                    </td>
                </tr>
            );
        }

        if (sessionQuery.isError) {
            return (
                <tr>
                    <td colSpan={6} className="tw-py-6 tw-text-center tw-text-red-600">
                        Unable to load sessions. Please refresh.
                    </td>
                </tr>
            );
        }

        if (!filteredSessions.length) {
            return (
                <tr>
                    <td colSpan={6} className="tw-py-10 tw-text-center tw-text-gray-500">
                        No sessions match the current filters.
                    </td>
                </tr>
            );
        }

        return filteredSessions.map((session) => {
            const attendance = session.attendanceSummary;
            const flagged = Boolean(session.adminReview?.flagged);
            return (
                <tr key={session.id} className="hover:tw-bg-gray-50">
                    <td className="tw-px-4 tw-py-4">
                        <div className="tw-flex tw-flex-col">
                            <span className="tw-font-semibold tw-text-gray-900">{session.subject}</span>
                            <span className="tw-text-sm tw-text-gray-500">{formatDateTime(session.date)}</span>
                            {flagged && (
                                <span className="tw-mt-2 tw-inline-flex tw-w-fit tw-rounded-full tw-bg-red-50 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-red-700">
                                    Flagged
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <div>
                            <p className="tw-text-sm tw-font-medium tw-text-gray-900">{session.mentor?.name ?? '—'}</p>
                            {session.mentor?.email && <p className="tw-text-xs tw-text-gray-500">{session.mentor.email}</p>}
                        </div>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <div>
                            <p className="tw-text-sm tw-font-medium tw-text-gray-900">{session.mentee?.name ?? (session.isGroup ? 'Group session' : '—')}</p>
                            {session.mentee?.email && <p className="tw-text-xs tw-text-gray-500">{session.mentee.email}</p>}
                        </div>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <div>
                            <p className="tw-text-sm tw-font-semibold tw-text-gray-900">{formatAttendance(session)}</p>
                            {attendance?.lastRecordedAt && (
                                <p className="tw-text-xs tw-text-gray-500">
                                    Last recorded {formatDateTime(attendance.lastRecordedAt)}
                                </p>
                            )}
                            {attendance && (
                                <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                                    Late {attendance.late ?? 0} · Absent {attendance.absent ?? 0}
                                </p>
                            )}
                        </div>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <span className="tw-inline-flex tw-rounded-full tw-bg-gray-100 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-gray-700">
                            {session.status}
                        </span>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <button
                            type="button"
                            onClick={() => setSelectedSession(session)}
                            className="tw-inline-flex tw-items-center tw-rounded-lg tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-purple-600 tw-ring-1 tw-ring-purple-200 hover:tw-bg-purple-50"
                        >
                            Review
                        </button>
                    </td>
                </tr>
            );
        });
    };

    return (
        <div className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-200 tw-shadow-sm">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-border-b tw-border-gray-100 tw-px-6 tw-py-4">
                <div>
                    <p className="tw-text-sm tw-uppercase tw-font-semibold tw-text-purple-600">Monitoring</p>
                    <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Session Tracker</h2>
                    <p className="tw-text-sm tw-text-gray-600">
                        Review confirmed, cancelled, or completed sessions and verify attendance submissions.
                    </p>
                </div>
                <div className="tw-flex tw-items-center tw-gap-3">
                    <button
                        type="button"
                        onClick={() => sessionQuery.refetch()}
                        className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                        disabled={sessionQuery.isFetching}
                    >
                        {sessionQuery.isFetching ? 'Refreshing…' : 'Refresh'}
                    </button>
                    <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-gray-700">
                        <input
                            type="checkbox"
                            checked={flaggedOnly}
                            onChange={(event) => setFlaggedOnly(event.target.checked)}
                            className="tw-h-4 tw-w-4 tw-rounded tw-border-gray-300 tw-text-purple-600 focus:tw-ring-purple-500"
                        />
                        Flagged only
                    </label>
                </div>
            </div>

            <div className="tw-border-b tw-border-gray-100 tw-bg-gray-50 tw-px-6 tw-py-4 tw-flex tw-flex-wrap tw-gap-3 tw-items-center">
                <div className="tw-flex tw-flex-wrap tw-gap-2" role="tablist" aria-label="Session status filters">
                    {STATUS_FILTERS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={filters.status === option.value}
                            onClick={() => handleStatusFilterChange(option.value)}
                            className={`tw-rounded-full tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-transition-colors ${
                                filters.status === option.value
                                    ? 'tw-bg-purple-600 tw-text-white'
                                    : 'tw-bg-white tw-text-gray-700 tw-border tw-border-gray-200 hover:tw-border-purple-300'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <div className="tw-flex tw-items-center tw-gap-3 tw-ml-auto">
                    <label className="tw-text-sm tw-text-gray-600 tw-font-medium">
                        Sort
                        <select
                            value={filters.sort ?? 'newest'}
                            onChange={handleSortChange}
                            className="tw-ml-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-2 tw-py-1 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </label>
                    <label className="tw-text-sm tw-text-gray-600 tw-font-medium">
                        Rows
                        <select
                            value={filters.limit ?? 10}
                            onChange={handleLimitChange}
                            className="tw-ml-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-2 tw-py-1 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="tw-overflow-x-auto">
                <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                    <thead className="tw-bg-gray-50">
                        <tr>
                            <th scope="col" className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                Session
                            </th>
                            <th scope="col" className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                Mentor
                            </th>
                            <th scope="col" className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                Mentee / Group
                            </th>
                            <th scope="col" className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                Attendance
                            </th>
                            <th scope="col" className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                Status
                            </th>
                            <th scope="col" className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="tw-divide-y tw-divide-gray-100 tw-bg-white">{renderRows()}</tbody>
                </table>
            </div>

            <div className="tw-flex tw-items-center tw-justify-between tw-border-t tw-border-gray-100 tw-bg-gray-50 tw-px-6 tw-py-4">
                <p className="tw-text-sm tw-text-gray-600">
                    Page {currentPage} of {totalPages}
                </p>
                <div className="tw-flex tw-gap-3">
                    <button
                        type="button"
                        onClick={() => handlePageChange('prev')}
                        disabled={currentPage <= 1}
                        className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 disabled:tw-opacity-60"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => handlePageChange('next')}
                        disabled={currentPage >= totalPages}
                        className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 disabled:tw-opacity-60"
                    >
                        Next
                    </button>
                </div>
            </div>

            {selectedSession && (
                <div
                    className="tw-fixed tw-inset-0 tw-z-50 tw-bg-black/40 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Review session"
                >
                    <div className="tw-w-full tw-max-w-lg tw-rounded-2xl tw-bg-white tw-shadow-2xl tw-border tw-border-gray-200">
                        <header className="tw-flex tw-items-start tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-border-gray-100">
                            <div>
                                <p className="tw-text-sm tw-font-semibold tw-text-purple-600">Session review</p>
                                <h3 className="tw-text-xl tw-font-bold tw-text-gray-900">{selectedSession.subject}</h3>
                                <p className="tw-text-sm tw-text-gray-500">{formatDateTime(selectedSession.date)}</p>
                            </div>
                            <button
                                type="button"
                                className="tw-text-gray-500 hover:tw-text-gray-800"
                                onClick={() => (!reviewMutation.isPending ? setSelectedSession(null) : null)}
                                aria-label="Close review dialog"
                            >
                                ✕
                            </button>
                        </header>
                        <form onSubmit={handleSubmitReview} className="tw-space-y-4 tw-px-6 tw-py-5">
                            <label className="tw-block">
                                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Status</span>
                                <select
                                    value={formState.status}
                                    onChange={(event) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            status: event.target.value as ReviewStatus,
                                        }))
                                    }
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formState.flagged}
                                    onChange={(event) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            flagged: event.target.checked,
                                        }))
                                    }
                                    className="tw-h-4 tw-w-4 tw-rounded tw-border-gray-300 tw-text-purple-600 focus:tw-ring-purple-500"
                                />
                                Flag this session for follow-up
                            </label>
                            <label className="tw-block">
                                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Reason</span>
                                <textarea
                                    value={formState.reason}
                                    onChange={(event) => setFormState((prev) => ({ ...prev, reason: event.target.value }))}
                                    rows={3}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                    placeholder="Provide context for the change"
                                />
                            </label>
                            <label className="tw-block">
                                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Notes</span>
                                <textarea
                                    value={formState.notes}
                                    onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                                    rows={4}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                    placeholder="Internal notes visible to administrators"
                                />
                            </label>
                            {formError && <p className="tw-text-sm tw-text-red-600">{formError}</p>}
                            <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-2">
                                <button
                                    type="button"
                                    onClick={() => (!reviewMutation.isPending ? setSelectedSession(null) : null)}
                                    className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                                    disabled={reviewMutation.isPending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="tw-inline-flex tw-items-center tw-rounded-lg tw-bg-purple-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 disabled:tw-opacity-70"
                                    disabled={reviewMutation.isPending}
                                >
                                    {reviewMutation.isPending ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSessionTrackerPanel;
