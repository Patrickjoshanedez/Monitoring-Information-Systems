import React, { useMemo, useState } from 'react';
import { useMenteeSessions, useCompleteSession } from '../../shared/hooks/useMenteeSessions';
import type { MenteeSession } from '../../shared/services/sessionsService';

type SortKey = 'subject' | 'mentor' | 'date' | 'duration';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const UpcomingSessionsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [selectedSession, setSelectedSession] = useState<MenteeSession | null>(null);
  const [notes, setNotes] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState('0');
  const [attended, setAttended] = useState(true);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: sessions = [], isLoading, isError, refetch, isFetching } = useMenteeSessions();
  const completeSession = useCompleteSession();

  const upcomingSessions = useMemo(() => sessions.filter((session) => !session.attended), [sessions]);

  const filteredSessions = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return upcomingSessions.filter((session) =>
      session.subject.toLowerCase().includes(lower) ||
      (session.mentor?.name?.toLowerCase().includes(lower) ?? false)
    );
  }, [upcomingSessions, searchTerm]);

  const sortedSessions = useMemo(() => {
    const toTime = (value?: string | null) => (value ? Date.parse(value) : 0);
    return [...filteredSessions].sort((a, b) => {
      switch (sortBy) {
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'mentor':
          return (a.mentor?.name || '').localeCompare(b.mentor?.name || '');
        case 'duration':
          return b.durationMinutes - a.durationMinutes;
        case 'date':
        default:
          return toTime(a.date) - toTime(b.date);
      }
    });
  }, [filteredSessions, sortBy]);

  const resetModalState = () => {
    setSelectedSession(null);
    setNotes('');
    setTasksCompleted('0');
    setAttended(true);
  };

  const openCompletionModal = (session: MenteeSession) => {
    setSelectedSession(session);
    setNotes(session.notes || '');
    setTasksCompleted(String(session.tasksCompleted || 0));
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

      setBanner({ type: 'success', message: 'Session marked as complete. Feedback is now available.' });
      resetModalState();
    } catch (error: any) {
      setBanner({ type: 'error', message: error?.message || 'Unable to complete session. Please try again.' });
    }
  };

  const showEmpty = !isLoading && sortedSessions.length === 0;

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-8">
      <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between tw-gap-4 tw-mb-6">
        <div>
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Upcoming Sessions</h2>
          <p className="tw-text-sm tw-text-gray-500">Track sessions awaiting completion. Marking a session complete unlocks feedback.</p>
        </div>
        <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-items-stretch md:tw-items-center">
          <div className="tw-relative">
            <input
              type="text"
              placeholder="Search by subject or mentor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tw-w-full md:tw-w-64 tw-px-4 tw-py-2 tw-pr-10 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            title="Sort sessions"
            aria-label="Sort sessions"
          >
            <option value="date">Sort by Date</option>
            <option value="subject">Sort by Subject</option>
            <option value="mentor">Sort by Mentor</option>
            <option value="duration">Sort by Duration</option>
          </select>
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

      {isError && (
        <div className="tw-bg-red-50 tw-text-red-700 tw-p-4 tw-rounded-lg tw-flex tw-items-center tw-justify-between tw-mb-4" role="alert">
          <span>We couldn’t load your sessions. Please refresh.</span>
          <button
            onClick={() => refetch()}
            className="tw-text-sm tw-font-medium tw-underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
          <thead className="tw-bg-gray-50">
            <tr>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Subject
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Mentor
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Scheduled
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Duration
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {isLoading || isFetching ? (
              [...Array(3)].map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="tw-px-6 tw-py-4" colSpan={5}>
                    <div className="tw-h-4 tw-bg-gray-100 tw-rounded tw-animate-pulse" />
                  </td>
                </tr>
              ))
            ) : (
              sortedSessions.map((session) => (
                <tr key={session.id} className="hover:tw-bg-gray-50">
                  <td className="tw-px-6 tw-py-4 tw-text-sm tw-font-medium tw-text-gray-900">{session.subject}</td>
                  <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">{session.mentor?.name || '—'}</td>
                  <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">{formatDate(session.date)}</td>
                  <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">{session.durationMinutes || 60} min</td>
                  <td className="tw-px-6 tw-py-4 tw-text-right">
                    <button
                      onClick={() => openCompletionModal(session)}
                      className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                    >
                      Mark complete
                    </button>
                  </td>
                </tr>
              ))
            )}
            {showEmpty && (
              <tr>
                <td className="tw-px-6 tw-py-6 tw-text-sm tw-text-gray-500" colSpan={5}>
                  No upcoming sessions. When your mentor schedules a meeting it will appear here.
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
          aria-labelledby="complete-session-title"
        >
          <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-p-6 tw-space-y-4">
            <div className="tw-flex tw-justify-between tw-items-start">
              <div>
                <p className="tw-text-sm tw-font-semibold tw-text-primary">Mark complete</p>
                <h3 id="complete-session-title" className="tw-text-xl tw-font-bold tw-text-gray-900">
                  {selectedSession.subject}
                </h3>
                <p className="tw-text-sm tw-text-gray-500">Mentor: {selectedSession.mentor?.name || '—'}</p>
              </div>
              <button
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
                    <input
                      type="radio"
                      name="attended"
                      value="yes"
                      checked={attended}
                      onChange={() => setAttended(true)}
                    />
                    Yes, it happened
                  </label>
                  <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium">
                    <input
                      type="radio"
                      name="attended"
                      value="no"
                      checked={!attended}
                      onChange={() => setAttended(false)}
                    />
                    No, it was cancelled
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="tasksCompleted" className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Tasks or objectives completed
                </label>
                <input
                  id="tasksCompleted"
                  type="number"
                  min="0"
                  value={tasksCompleted}
                  onChange={(e) => setTasksCompleted(e.target.value)}
                  className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                />
              </div>

              <div>
                <label htmlFor="sessionNotes" className="tw-text-sm tw-font-medium tw-text-gray-700">
                  Notes for your mentor (optional)
                </label>
                <textarea
                  id="sessionNotes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {completeSession.isLoading ? 'Saving…' : 'Save and continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingSessionsTable;

