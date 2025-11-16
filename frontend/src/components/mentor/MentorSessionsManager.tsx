import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompleteMentorSession, useMentorSessions } from '../../shared/hooks/useMentorSessions';
import type { ApiWarning, MentorSession, SessionParticipant } from '../../shared/services/sessionsService';
import MentorSessionComposer from './MentorSessionComposer';

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
};

const getParticipantList = (session: MentorSession): SessionParticipant[] => {
    if (session.participants && session.participants.length > 0) {
        return session.participants;
    }
    if (session.mentee) {
        return [session.mentee];
    }
    return [];
};

const getPrimaryParticipantName = (session: MentorSession) => {
    const participants = getParticipantList(session);
    return participants[0]?.name || '';
};

const MentorSessionsManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
    const [sortBy, setSortBy] = useState<'date' | 'student' | 'subject'>('date');
    const [selectedSession, setSelectedSession] = useState<MentorSession | null>(null);
    const [tasksCompleted, setTasksCompleted] = useState('0');
    const [notes, setNotes] = useState('');
    const [attended, setAttended] = useState(true);
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isComposerOpen, setComposerOpen] = useState(false);

    const { data: sessions = [], isLoading, isError, isFetching, refetch } = useMentorSessions();
    const completeSession = useCompleteMentorSession();
    const navigate = useNavigate();

    const handleSessionScheduled = (session: MentorSession, warnings?: ApiWarning[]) => {
        if (warnings && warnings.length > 0) {
            const mergedWarnings = warnings.map((warning) => warning.message).join(' ');
            setBanner({
                type: 'success',
                message: `Session "${session.subject}" scheduled. ${mergedWarnings}`,
            });
            return;
        }

        setBanner({ type: 'success', message: `Session "${session.subject}" scheduled and invites sent.` });
    };

    const handleOpenChat = (threadId?: string | null) => {
        if (!threadId) {
            setBanner({ type: 'error', message: 'Chat will be ready once the session syncs. Try again shortly.' });
            return;
        }
        navigate(`/chat?threadId=${threadId}`);
    };

    const stats = useMemo(() => {
        const total = sessions.length;
        const completed = sessions.filter((session) => (session.status ? session.status === 'completed' : session.attended)).length;
        const upcoming = sessions.filter((session) => (session.status ? session.status === 'upcoming' : !session.attended)).length;
        const awaitingFeedback = sessions.filter((session) => session.feedbackDue).length;
        return { total, upcoming, completed, awaitingFeedback };
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        const lower = searchTerm.trim().toLowerCase();
        return sessions
            .filter((session) => {
                if (statusFilter === 'upcoming' && session.attended) return false;
                if (statusFilter === 'completed' && !session.attended) return false;
                if (!lower) return true;
                const participantNames = getParticipantList(session)
                    .map((participant) => participant.name)
                    .join(' ');
                const haystack = `${session.subject} ${session.mentee?.name || ''} ${participantNames}`.toLowerCase();
                return haystack.includes(lower);
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'student':
                        return getPrimaryParticipantName(a).localeCompare(getPrimaryParticipantName(b));
                    case 'subject':
                        return a.subject.localeCompare(b.subject);
                    case 'date':
                    default:
                        return Date.parse(a.date) - Date.parse(b.date);
                }
            });
    }, [sessions, searchTerm, statusFilter, sortBy]);

    const resetModalState = () => {
        setSelectedSession(null);
        setTasksCompleted('0');
        setNotes('');
        setAttended(true);
    };

    const openCompletionModal = (session: MentorSession) => {
        setSelectedSession(session);
        setTasksCompleted(String(session.tasksCompleted || 0));
        setNotes(session.notes || '');
        setAttended(true);
    };

    const handleComplete = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedSession) return;

        try {
            await completeSession.mutateAsync({
                sessionId: selectedSession.id,
                payload: {
                    attended,
                    tasksCompleted: Number(tasksCompleted) || 0,
                    notes: notes.trim() ? notes.trim() : null,
                },
            });
            setBanner({ type: 'success', message: 'Session updated. The mentee can now submit feedback.' });
            resetModalState();
        } catch (error: any) {
            setBanner({ type: 'error', message: error?.message || 'Unable to update session. Try again.' });
        }
    };

    const showEmpty = !isLoading && filteredSessions.length === 0;

    return (
        <>
        <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100 tw-p-6">
            <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-start tw-gap-6 tw-mb-6">
                <div className="tw-space-y-3">
                    <div>
                        <p className="tw-text-sm tw-font-semibold tw-text-primary">Mentor tools</p>
                        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Manage student sessions</h2>
                        <p className="tw-text-sm tw-text-gray-500">
                            Log attendance, capture notes, and unlock mentee feedback as soon as your session wraps.
                        </p>
                        <p className="tw-text-xs tw-text-gray-400">Scheduling a session automatically invites mentees to a shared chat.</p>
                    </div>
                    <div className="tw-flex tw-flex-wrap tw-gap-3">
                        <button
                            type="button"
                            onClick={() => setComposerOpen(true)}
                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                        >
                            Schedule session
                        </button>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-4 tw-py-2 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200"
                        >
                            Refresh list
                        </button>
                    </div>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-gap-4">
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                        <p className="tw-text-xs tw-uppercase tw-text-gray-500">Upcoming</p>
                        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.upcoming}</p>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                        <p className="tw-text-xs tw-uppercase tw-text-gray-500">Completed</p>
                        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.completed}</p>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                        <p className="tw-text-xs tw-uppercase tw-text-gray-500">Awaiting feedback</p>
                        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.awaitingFeedback}</p>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                        <p className="tw-text-xs tw-uppercase tw-text-gray-500">Total</p>
                        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.total}</p>
                    </div>
                </div>
            </div>

            {banner && (
                <div
                    role="status"
                    className={`tw-mb-4 tw-rounded-lg tw-border tw-p-3 tw-text-sm ${
                        banner.type === 'success'
                            ? 'tw-bg-green-50 tw-border-green-200 tw-text-green-800'
                            : 'tw-bg-red-50 tw-border-red-200 tw-text-red-700'
                    }`}
                >
                    <div className="tw-flex tw-justify-between tw-items-center">
                        <span>{banner.message}</span>
                        <button
                            onClick={() => setBanner(null)}
                            className="tw-text-xs tw-uppercase tw-font-semibold"
                            aria-label="Dismiss message"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-mb-4">
                <div className="tw-relative tw-flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by student or subject"
                        aria-label="Search sessions"
                        className="tw-w-full tw-px-4 tw-py-2 tw-pr-10 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600"
                            onClick={() => setSearchTerm('')}
                        >
                            ×
                        </button>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                    className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                    aria-label="Filter sessions by status"
                >
                    <option value="upcoming">Upcoming only</option>
                    <option value="completed">Completed</option>
                    <option value="all">All sessions</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                    className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                    aria-label="Sort sessions"
                >
                    <option value="date">Sort by date</option>
                    <option value="student">Sort by student</option>
                    <option value="subject">Sort by subject</option>
                </select>
            </div>

            {isError && (
                <div className="tw-bg-red-50 tw-text-red-700 tw-p-4 tw-rounded-lg tw-flex tw-items-center tw-justify-between tw-mb-4" role="alert">
                    <span>We couldn’t load your sessions. Please refresh.</span>
                    <button onClick={() => refetch()} className="tw-text-sm tw-font-medium tw-underline">
                        Retry
                    </button>
                </div>
            )}

            <div className="tw-overflow-x-auto">
                <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                    <thead className="tw-bg-gray-50">
                        <tr>
                            <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Session</th>
                            <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Schedule</th>
                            <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Location & capacity</th>
                            <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Status</th>
                            <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
                        {isLoading || isFetching ? (
                            [...Array(3)].map((_, index) => (
                                <tr key={`loading-${index}`}>
                                    <td className="tw-px-6 tw-py-4" colSpan={5}>
                                        <div className="tw-h-4 tw-bg-gray-100 tw-rounded tw-animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            filteredSessions.map((session) => {
                                const participants = getParticipantList(session);
                                const visibleParticipants = participants.slice(0, 3);
                                const overflow = participants.length - visibleParticipants.length;

                                return (
                                    <tr key={session.id} className="hover:tw-bg-gray-50">
                                        <td className="tw-px-6 tw-py-4 tw-align-top">
                                            <div className="tw-text-sm tw-font-semibold tw-text-gray-900">{session.subject}</div>
                                            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-1">
                                                {visibleParticipants.length ? (
                                                    visibleParticipants.map((participant) => (
                                                        <span
                                                            key={`${session.id}-${participant.id}`}
                                                            className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-text-gray-700 tw-text-xs tw-font-medium tw-px-3 tw-py-1"
                                                        >
                                                            {participant.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="tw-text-xs tw-text-gray-500">No participants yet</span>
                                                )}
                                                {overflow > 0 ? (
                                                    <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-text-gray-600 tw-text-xs tw-font-medium tw-px-3 tw-py-1">+{overflow} more</span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-align-top">
                                            <div className="tw-text-sm tw-text-gray-900">{formatDate(session.date)}</div>
                                            <p className="tw-text-xs tw-text-gray-500">{session.durationMinutes || 60} min</p>
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-align-top">
                                            <div className="tw-text-sm tw-text-gray-900">{session.room || 'Room TBA'}</div>
                                            <p className="tw-text-xs tw-text-gray-500">
                                                {`${session.participantCount ?? 0}/${session.capacity ?? session.participantCount ?? 0} seats`}
                                            </p>
                                            <span
                                                className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-rounded-full tw-px-2 tw-py-0.5 tw-mt-2 ${
                                                    session.isGroup ? 'tw-bg-blue-50 tw-text-blue-700' : 'tw-bg-purple-50 tw-text-purple-700'
                                                }`}
                                            >
                                                {session.isGroup ? 'Group session' : '1:1 session'}
                                            </span>
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-align-top">
                                            {(() => {
                                                const status = session.status || (session.attended ? 'completed' : 'upcoming');
                                                if (status === 'completed') {
                                                    return (
                                                        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-green-700 tw-bg-green-50 tw-rounded-full tw-px-3 tw-py-1">
                                                            <span aria-hidden="true">●</span> Completed
                                                        </span>
                                                    );
                                                }
                                                if (status === 'overdue') {
                                                    return (
                                                        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-red-700 tw-bg-red-50 tw-rounded-full tw-px-3 tw-py-1">
                                                            <span aria-hidden="true">●</span> Needs update
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-amber-700 tw-bg-amber-50 tw-rounded-full tw-px-3 tw-py-1">
                                                        <span aria-hidden="true">●</span> Upcoming
                                                    </span>
                                                );
                                            })()}
                                            {session.feedbackDue ? (
                                                <div className="tw-mt-2">
                                                    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-rounded-full tw-bg-blue-50 tw-text-blue-700 tw-px-2 tw-py-0.5">
                                                        Awaiting mentee feedback
                                                    </span>
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-align-top tw-text-right">
                                            <div className="tw-flex tw-flex-wrap tw-gap-2 tw-justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenChat(session.chatThreadId)}
                                                    disabled={!session.chatThreadId}
                                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-3 tw-py-2 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200 disabled:tw-opacity-50"
                                                >
                                                    Open chat
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openCompletionModal(session)}
                                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                                                >
                                                    {session.attended ? 'Update' : 'Mark complete'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        {showEmpty && (
                            <tr>
                                <td className="tw-px-6 tw-py-6 tw-text-sm tw-text-gray-500" colSpan={5}>
                                    No sessions match your filters. Try another search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedSession && (
                <div
                    className="tw-fixed tw-inset-0 tw-bg-black/30 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-z-40"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="mentor-complete-session-title"
                >
                    <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-xl tw-p-6 tw-space-y-4">
                        <div className="tw-flex tw-justify-between tw-items-start">
                            <div>
                                <p className="tw-text-sm tw-font-semibold tw-text-primary">Update session</p>
                                <h3 id="mentor-complete-session-title" className="tw-text-xl tw-font-bold tw-text-gray-900">
                                    {selectedSession.subject}
                                </h3>
                                <p className="tw-text-sm tw-text-gray-500">Mentee: {selectedSession.mentee?.name || '—'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={resetModalState}
                                className="tw-text-gray-400 hover:tw-text-gray-600"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form className="tw-space-y-4" onSubmit={handleComplete}>
                            <div>
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700">Did this session take place?</label>
                                <div className="tw-mt-2 tw-flex tw-gap-4">
                                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium">
                                        <input type="radio" name="attended" value="yes" checked={attended} onChange={() => setAttended(true)} />
                                        Yes
                                    </label>
                                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium">
                                        <input type="radio" name="attended" value="no" checked={!attended} onChange={() => setAttended(false)} />
                                        No / cancelled
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="mentorTasksCompleted" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Tasks or objectives covered
                                </label>
                                <input
                                    id="mentorTasksCompleted"
                                    type="number"
                                    min="0"
                                    value={tasksCompleted}
                                    onChange={(event) => setTasksCompleted(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="mentorSessionNotes" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Notes for the mentee (optional)
                                </label>
                                <textarea
                                    id="mentorSessionNotes"
                                    rows={3}
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                />
                            </div>

                            <div className="tw-flex tw-justify-end tw-gap-3">
                                <button
                                    type="button"
                                    onClick={resetModalState}
                                    className="tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-gray-700 hover:tw-bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={completeSession.isLoading}
                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary disabled:tw-opacity-60"
                                >
                                    {completeSession.isLoading ? 'Saving…' : 'Save update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>

        <MentorSessionComposer
            isOpen={isComposerOpen}
            onClose={() => setComposerOpen(false)}
            onCreated={handleSessionScheduled}
        />
        </>
    );
};

export default MentorSessionsManager;
