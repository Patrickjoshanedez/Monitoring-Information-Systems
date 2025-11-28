import React, { useEffect, useMemo, useState } from 'react';
import {
    AdminFeedbackFilters,
    AdminFeedbackFlagFilter,
    AdminFeedbackRecord,
    AdminFeedbackSentiment,
    buildAdminFeedbackExportUrl,
    useAdminFeedbackList,
    useAdminFeedbackModeration,
    useAdminFeedbackSummary,
} from '../../hooks/useAdminFeedback';
import { useToast } from '../../hooks/useToast';

const sentimentOptions: Array<{ label: string; value: AdminFeedbackSentiment; description: string }> = [
    { label: 'All ratings', value: 'all', description: 'Every submitted review' },
    { label: 'Low (≤ 3)', value: 'low', description: 'Fast-track reviews that may need attention' },
    { label: 'High (≥ 4)', value: 'high', description: 'Celebrate standout sessions' },
];

const flagOptions: Array<{ label: string; value: AdminFeedbackFlagFilter }> = [
    { label: 'All feedback', value: 'all' },
    { label: 'Flagged', value: 'flagged' },
    { label: 'Unflagged', value: 'unflagged' },
];

const pageSizeOptions = [10, 20, 50];

const formatDate = (value?: string | null) => {
    if (!value) {
        return '—';
    }
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
};

const getCommentPreview = (record: AdminFeedbackRecord) => {
    const text = record.sanitizedComment || record.comment;
    if (!text) {
        return 'No comment provided';
    }
    if (text.length <= 160) {
        return text;
    }
    return `${text.slice(0, 157)}…`;
};

const AdminFeedbackDashboard: React.FC = () => {
    const [filters, setFilters] = useState<AdminFeedbackFilters>({
        page: 1,
        limit: 10,
        sort: 'newest',
        sentiment: 'all',
        flagged: 'all',
        commentOnly: false,
    });
    const [searchValue, setSearchValue] = useState(filters.search ?? '');
    const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedbackRecord | null>(null);
    const [moderationForm, setModerationForm] = useState({ flagged: false, reason: '' });
    const [formError, setFormError] = useState('');
    const listQuery = useAdminFeedbackList(filters);
    const summaryQuery = useAdminFeedbackSummary();
    const moderationMutation = useAdminFeedbackModeration();
    const { showToast } = useToast();

    const feedback = listQuery.data?.feedback ?? [];
    const pagination = listQuery.data?.meta?.pagination;
    const currentPage = pagination?.page ?? filters.page ?? 1;
    const totalPages = pagination?.pages ?? 1;
    const lowRatingThreshold = summaryQuery.data?.lowRatingThreshold ?? 3;
    const exportUrl = useMemo(() => buildAdminFeedbackExportUrl(filters), [filters]);

    useEffect(() => {
        if (!selectedFeedback) {
            setModerationForm({ flagged: false, reason: '' });
            setFormError('');
            return;
        }
        setModerationForm({
            flagged: Boolean(selectedFeedback.moderation?.flagged),
            reason: selectedFeedback.moderation?.reason ?? '',
        });
        setFormError('');
    }, [selectedFeedback]);

    const handleSentimentChange = (value: AdminFeedbackSentiment) => {
        setFilters((prev) => ({ ...prev, sentiment: value, page: 1 }));
    };

    const handleFlagChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value as AdminFeedbackFlagFilter;
        setFilters((prev) => ({ ...prev, flagged: value, page: 1 }));
    };

    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value as NonNullable<AdminFeedbackFilters['sort']>;
        setFilters((prev) => ({ ...prev, sort: value, page: 1 }));
    };

    const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = Number(event.target.value);
        setFilters((prev) => ({ ...prev, limit: value, page: 1 }));
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

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = searchValue.trim();
        setFilters((prev) => ({ ...prev, search: trimmed || undefined, page: 1 }));
    };

    const handleToggleCommentOnly = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setFilters((prev) => ({ ...prev, commentOnly: checked, page: 1 }));
    };

    const handleModerationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedFeedback) {
            return;
        }
        const trimmedReason = moderationForm.reason.trim();
        if (moderationForm.flagged && !trimmedReason) {
            setFormError('Please provide a short reason when flagging feedback.');
            return;
        }
        setFormError('');
        try {
            const updated = await moderationMutation.mutateAsync({
                feedbackId: selectedFeedback.id,
                flagged: moderationForm.flagged,
                reason: trimmedReason || null,
            });
            setSelectedFeedback(updated);
            showToast({ message: moderationForm.flagged ? 'Feedback flagged.' : 'Feedback unflagged.', variant: 'success' });
        } catch (error: any) {
            const message = error?.response?.data?.message ?? 'Unable to update moderation.';
            setFormError(typeof message === 'string' ? message : 'Unable to update moderation.');
        }
    };

    const renderTableBody = () => {
        if (listQuery.isLoading) {
            return (
                <tr>
                    <td colSpan={6} className="tw-py-10 tw-text-center">
                        <div className="tw-inline-flex tw-items-center tw-gap-2 tw-text-gray-600">
                            <span className="tw-h-5 tw-w-5 tw-animate-spin tw-rounded-full tw-border-b-2 tw-border-purple-500" aria-hidden="true" />
                            Loading feedback…
                        </div>
                    </td>
                </tr>
            );
        }

        if (listQuery.isError) {
            return (
                <tr>
                    <td colSpan={6} className="tw-py-6 tw-text-center tw-text-red-600">
                        Unable to load feedback. Please refresh.
                    </td>
                </tr>
            );
        }

        if (!feedback.length) {
            return (
                <tr>
                    <td colSpan={6} className="tw-py-10 tw-text-center tw-text-gray-500">
                        No feedback matches the current filters.
                    </td>
                </tr>
            );
        }

        return feedback.map((entry) => {
            const lowRating = entry.rating <= lowRatingThreshold;
            const flagged = Boolean(entry.moderation?.flagged);
            return (
                <tr key={entry.id} className={lowRating ? 'tw-bg-red-50/60' : 'hover:tw-bg-gray-50'}>
                    <td className="tw-px-4 tw-py-4">
                        <div className="tw-flex tw-flex-col">
                            <span className="tw-text-sm tw-font-semibold tw-text-gray-900">{entry.session?.subject ?? 'Mentoring session'}</span>
                            <span className="tw-text-xs tw-text-gray-500">{formatDate(entry.createdAt)}</span>
                        </div>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <div>
                            <p className="tw-text-sm tw-font-medium tw-text-gray-900">{entry.mentee?.name ?? '—'}</p>
                            {entry.mentee?.email && <p className="tw-text-xs tw-text-gray-500">{entry.mentee.email}</p>}
                        </div>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <div>
                            <p className="tw-text-sm tw-font-medium tw-text-gray-900">{entry.mentor?.name ?? '—'}</p>
                            {entry.mentor?.email && <p className="tw-text-xs tw-text-gray-500">{entry.mentor.email}</p>}
                        </div>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <span
                            className={`tw-inline-flex tw-rounded-full tw-px-3 tw-py-1 tw-text-sm tw-font-semibold ${
                                lowRating ? 'tw-bg-red-100 tw-text-red-800' : 'tw-bg-green-100 tw-text-green-800'
                            }`}
                        >
                            {entry.rating.toFixed(1)} / 5
                        </span>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <p className="tw-text-sm tw-text-gray-700 tw-line-clamp-3">{getCommentPreview(entry)}</p>
                    </td>
                    <td className="tw-px-4 tw-py-4">
                        <div className="tw-flex tw-items-center tw-gap-2">
                            {flagged && (
                                <span className="tw-inline-flex tw-rounded-full tw-bg-red-100 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-red-700">
                                    Flagged
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setSelectedFeedback(entry)}
                                className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-border-purple-400"
                            >
                                Review
                            </button>
                        </div>
                    </td>
                </tr>
            );
        });
    };

    return (
        <div className="tw-space-y-6">
            <header className="tw-flex tw-flex-col tw-gap-2">
                <p className="tw-text-sm tw-font-semibold tw-uppercase tw-text-purple-600">Quality insights</p>
                <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Mentor Feedback Dashboard</h1>
                <p className="tw-text-gray-600 tw-max-w-3xl">
                    Track mentee sentiments, spotlight low ratings, and take quick moderation actions.
                </p>
            </header>

            <section className="tw-grid tw-gap-4 tw-grid-cols-1 md:tw-grid-cols-3">
                {[{
                    label: 'Total reviews',
                    value: summaryQuery.data?.totalCount ?? 0,
                    caption: 'All mentor feedback submissions',
                }, {
                    label: 'Flagged reviews',
                    value: summaryQuery.data?.flaggedCount ?? 0,
                    caption: 'Require follow-up',
                }, {
                    label: `Low ratings (≤ ${lowRatingThreshold})`,
                    value: summaryQuery.data?.lowRatingCount ?? 0,
                    caption: 'Auto-filtered for quality checks',
                }].map((card) => (
                    <div key={card.label} className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-5 tw-shadow-sm">
                        <p className="tw-text-sm tw-font-medium tw-text-gray-600">{card.label}</p>
                        <p className="tw-mt-2 tw-text-3xl tw-font-bold tw-text-gray-900">{card.value.toLocaleString()}</p>
                        <p className="tw-mt-1 tw-text-xs tw-text-gray-500">{card.caption}</p>
                    </div>
                ))}
            </section>

            <section className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-shadow-sm">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-border-b tw-border-gray-100 tw-px-6 tw-py-4">
                    <form onSubmit={handleSearchSubmit} className="tw-flex tw-flex-1 tw-items-center tw-gap-2" role="search">
                        <input
                            type="search"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Search comments or reasons"
                            className="tw-flex-1 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                        />
                        <button
                            type="submit"
                            className="tw-rounded-lg tw-bg-purple-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700"
                        >
                            Apply
                        </button>
                        {filters.search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchValue('');
                                    setFilters((prev) => ({ ...prev, search: undefined, page: 1 }));
                                }}
                                className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700"
                            >
                                Clear
                            </button>
                        )}
                    </form>
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <button
                            type="button"
                            onClick={() => listQuery.refetch()}
                            className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700"
                            disabled={listQuery.isFetching}
                        >
                            {listQuery.isFetching ? 'Refreshing…' : 'Refresh'}
                        </button>
                        <a
                            href={exportUrl}
                            className="tw-rounded-lg tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-gray-800"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Export CSV
                        </a>
                    </div>
                </div>

                <div className="tw-flex tw-flex-wrap tw-gap-4 tw-border-b tw-border-gray-100 tw-bg-gray-50 tw-px-6 tw-py-4">
                    <div className="tw-flex tw-flex-wrap tw-gap-2" role="tablist" aria-label="Sentiment filters">
                        {sentimentOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                role="tab"
                                aria-selected={filters.sentiment === option.value}
                                onClick={() => handleSentimentChange(option.value)}
                                className={`tw-rounded-full tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium ${
                                    filters.sentiment === option.value
                                        ? 'tw-bg-purple-600 tw-text-white'
                                        : 'tw-bg-white tw-text-gray-700 tw-border tw-border-gray-200 hover:tw-border-purple-300'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-600">
                        Flag filter
                        <select
                            value={filters.flagged ?? 'all'}
                            onChange={handleFlagChange}
                            className="tw-ml-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-2 tw-py-1 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                        >
                            {flagOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-gray-600">
                        <input
                            type="checkbox"
                            className="tw-h-4 tw-w-4 tw-rounded tw-border-gray-300 tw-text-purple-600 focus:tw-ring-purple-500"
                            checked={Boolean(filters.commentOnly)}
                            onChange={handleToggleCommentOnly}
                        />
                        Comments only
                    </label>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-600">
                        Sort
                        <select
                            value={filters.sort ?? 'newest'}
                            onChange={handleSortChange}
                            className="tw-ml-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-2 tw-py-1 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="rating-high">Rating (high → low)</option>
                            <option value="rating-low">Rating (low → high)</option>
                        </select>
                    </label>
                    <label className="tw-text-sm tw-font-medium tw-text-gray-600">
                        Rows
                        <select
                            value={filters.limit ?? 10}
                            onChange={handleLimitChange}
                            className="tw-ml-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-2 tw-py-1 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="tw-overflow-x-auto">
                    <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                        <thead className="tw-bg-gray-50">
                            <tr>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">Session</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">Mentee</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">Mentor</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">Rating</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">Comment</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="tw-divide-y tw-divide-gray-100 tw-bg-white">{renderTableBody()}</tbody>
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
                            className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 disabled:tw-opacity-60"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePageChange('next')}
                            disabled={currentPage >= totalPages}
                            className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 disabled:tw-opacity-60"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {selectedFeedback && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-p-4" role="dialog" aria-modal="true" aria-label="Review feedback">
                    <div className="tw-w-full tw-max-w-2xl tw-rounded-2xl tw-bg-white tw-shadow-2xl tw-border tw-border-gray-200">
                        <header className="tw-flex tw-items-start tw-justify-between tw-border-b tw-border-gray-100 tw-px-6 tw-py-4">
                            <div>
                                <p className="tw-text-sm tw-font-semibold tw-text-purple-600">Feedback review</p>
                                <h2 className="tw-text-xl tw-font-bold tw-text-gray-900">{selectedFeedback.session?.subject ?? 'Mentoring session'}</h2>
                                <p className="tw-text-sm tw-text-gray-600">Submitted {formatDate(selectedFeedback.createdAt)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedFeedback(null)}
                                className="tw-rounded-full tw-bg-gray-100 tw-p-2 tw-text-gray-600 hover:tw-bg-gray-200"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </header>
                        <div className="tw-grid tw-gap-4 tw-px-6 tw-py-4 md:tw-grid-cols-2">
                            <div className="tw-space-y-2">
                                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700">Participants</h3>
                                <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-3 tw-text-sm tw-text-gray-700">
                                    <p><span className="tw-font-semibold">Mentee:</span> {selectedFeedback.mentee?.name ?? '—'}</p>
                                    {selectedFeedback.mentee?.email && (
                                        <p className="tw-text-xs tw-text-gray-500">{selectedFeedback.mentee.email}</p>
                                    )}
                                    <p className="tw-mt-2"><span className="tw-font-semibold">Mentor:</span> {selectedFeedback.mentor?.name ?? '—'}</p>
                                    {selectedFeedback.mentor?.email && (
                                        <p className="tw-text-xs tw-text-gray-500">{selectedFeedback.mentor.email}</p>
                                    )}
                                </div>
                            </div>
                            <div className="tw-space-y-2">
                                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700">Rating & visibility</h3>
                                <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-3 tw-text-sm tw-text-gray-700">
                                    <p className="tw-font-semibold tw-text-lg">
                                        {selectedFeedback.rating.toFixed(1)} / 5
                                    </p>
                                    <p className="tw-text-xs tw-text-gray-500">{selectedFeedback.visibility === 'private' ? 'Private to mentee & admin' : 'Visible to mentee'}</p>
                                </div>
                            </div>
                            <div className="md:tw-col-span-2">
                                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700">Comment</h3>
                                <p className="tw-mt-2 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-text-sm tw-text-gray-800">
                                    {selectedFeedback.sanitizedComment || selectedFeedback.comment || 'No comment provided.'}
                                </p>
                            </div>
                        </div>
                        <form onSubmit={handleModerationSubmit} className="tw-space-y-4 tw-border-t tw-border-gray-100 tw-px-6 tw-py-4">
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="tw-h-4 tw-w-4 tw-rounded tw-border-gray-300 tw-text-purple-600 focus:tw-ring-purple-500"
                                        checked={moderationForm.flagged}
                                        onChange={(event) => setModerationForm((prev) => ({ ...prev, flagged: event.target.checked }))}
                                    />
                                    Flag this feedback
                                </label>
                                {moderationForm.flagged && (
                                    <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-red-600">Requires follow-up</span>
                                )}
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="moderation-reason">
                                    Moderation notes
                                </label>
                                <textarea
                                    id="moderation-reason"
                                    value={moderationForm.reason}
                                    onChange={(event) => setModerationForm((prev) => ({ ...prev, reason: event.target.value }))}
                                    placeholder="Document why this review needs attention"
                                    className="tw-mt-1 tw-h-24 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                    maxLength={500}
                                />
                                <p className="tw-mt-1 tw-text-xs tw-text-gray-500">500 characters max.</p>
                            </div>
                            {formError && <p className="tw-text-sm tw-text-red-600" role="alert">{formError}</p>}
                            <div className="tw-flex tw-justify-end tw-gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedFeedback(null)}
                                    className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="tw-rounded-lg tw-bg-purple-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 disabled:tw-opacity-60"
                                    disabled={moderationMutation.isLoading}
                                >
                                    {moderationMutation.isLoading ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFeedbackDashboard;
