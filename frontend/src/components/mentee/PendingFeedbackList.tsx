import React, { useMemo, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { usePendingFeedbackSessions, useSubmitSessionFeedback } from '../../shared/hooks/useSessionFeedback';
import { useMenteeSessions } from '../../shared/hooks/useMenteeSessions';
import type { PendingFeedbackSession } from '../../shared/services/feedbackService';
import RecaptchaField from '../common/RecaptchaField.jsx';
import logger from '../../shared/utils/logger';
import { getFeatureFlag } from '../../shared/utils/featureFlags';

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const PendingFeedbackList: React.FC = () => {
  const feedbackFeatureEnabled = getFeatureFlag('SESSION_FEEDBACK');

  if (!feedbackFeatureEnabled) {
    return (
      <section className="tw-bg-white tw-rounded-2xl tw-shadow tw-border tw-border-gray-100 tw-p-6 tw-mb-8">
        <div className="tw-flex tw-flex-col tw-gap-2">
          <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Session feedback is currently unavailable</p>
          <p className="tw-text-sm tw-text-gray-600">
            Our team is rolling out new feedback tooling. Sit tight—this section will return shortly.
          </p>
        </div>
      </section>
    );
  }

  const { data: apiSessions, isLoading, isError, refetch, error } = usePendingFeedbackSessions();
  const { data: menteeSessions = [] } = useMenteeSessions();
  const submitFeedback = useSubmitSessionFeedback();

  const [selectedSession, setSelectedSession] = useState<PendingFeedbackSession | null>(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [flagging, setFlagging] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'soonest' | 'latest' | 'mentor'>('soonest');
  type RecaptchaFieldHandle = { reset: () => void };
  type RecaptchaProps = {
    onChange?: (token: string | null) => void;
    onExpired?: () => void;
    className?: string;
  };
  const RecaptchaFieldWithRef = RecaptchaField as React.ForwardRefExoticComponent<
    RecaptchaProps & React.RefAttributes<RecaptchaFieldHandle>
  >;
  const recaptchaRef = useRef<RecaptchaFieldHandle | null>(null);

  const apiError = error as AxiosError<{ message?: string }> | null;

  const fallbackPendingSessions = useMemo(() => {
    return menteeSessions
      .filter((session) => session.feedbackDue)
      .map((session) => ({
        id: session.id,
        subject: session.subject,
        mentor: {
          id: session.mentor?.id || null,
          name: session.mentor?.name || 'Mentor',
        },
        date: session.completedAt || session.date,
        feedbackWindowClosesAt: session.feedbackWindowClosesAt || null,
      }));
  }, [menteeSessions]);

  const pendingSessions = useMemo(() => {
    if (apiSessions && apiSessions.length > 0) {
      return apiSessions;
    }
    return fallbackPendingSessions;
  }, [apiSessions, fallbackPendingSessions]);

  const pendingCount = pendingSessions.length;
  const hasPending = pendingCount > 0;

  const getDueDate = (session: PendingFeedbackSession) => session.feedbackWindowClosesAt || session.date;

  const filteredSessions = useMemo(() => {
    const list = pendingSessions;
    if (!list.length) {
      return [];
    }

    const query = searchTerm.trim().toLowerCase();
    const shortlist = query
      ? list.filter((session) => {
          const haystack = `${session.subject} ${session.mentor?.name || ''}`.toLowerCase();
          return haystack.includes(query);
        })
      : [...list];

  const getTimeValue = (session: PendingFeedbackSession) => new Date(getDueDate(session)).getTime();

    return shortlist.sort((first, second) => {
      if (sortOrder === 'latest') {
        return getTimeValue(second) - getTimeValue(first);
      }

      if (sortOrder === 'mentor') {
        return (first.mentor?.name || '').localeCompare(second.mentor?.name || '');
      }

      return getTimeValue(first) - getTimeValue(second);
    });
  }, [pendingSessions, searchTerm, sortOrder]);

  const uniqueMentorCount = useMemo(() => {
    if (!pendingSessions.length) {
      return 0;
    }
    const identifiers = pendingSessions.map((session) => session.mentor?.id || session.mentor?.name);
    return new Set(identifiers.filter(Boolean)).size;
  }, [pendingSessions]);

  const nextDueSession = useMemo(() => {
    if (!pendingSessions.length) {
      return null;
    }
    const sortedByDate = [...pendingSessions].sort(
      (first, second) => new Date(getDueDate(first)).getTime() - new Date(getDueDate(second)).getTime()
    );
    return sortedByDate[0];
  }, [pendingSessions]);

  const relativeDueText = useMemo(() => {
    if (!nextDueSession) {
      return null;
    }

    try {
  const target = new Date(getDueDate(nextDueSession)).getTime();
      if (Number.isNaN(target)) {
        return null;
      }
      const diffMs = target - Date.now();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      return formatter.format(diffDays, 'day');
    } catch {
      return null;
    }
  }, [nextDueSession]);

  const filterApplied = Boolean(searchTerm.trim());

  const resetForm = () => {
    setRating(0);
    setFeedbackText('');
    setFlagging(false);
    setFlagReason('');
    setFormError(null);
    setSuccessMessage(null);
    setRecaptchaToken(null);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleOpenModal = (session: PendingFeedbackSession) => {
    setSelectedSession(session);
    resetForm();
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSession) {
      return;
    }

    if (rating < 1 || rating > 5) {
      setFormError('Please choose a rating from 1 to 5 stars.');
      return;
    }

    if (!recaptchaToken) {
      setFormError('Please complete the verification step.');
      return;
    }

    const trimmedComment = feedbackText.trim();
    const trimmedFlag = flagReason.trim();
    if (flagging && !trimmedFlag) {
      setFormError('Please describe the issue so admins can review it.');
      return;
    }

    setFormError(null);

    try {
      await submitFeedback.mutateAsync({
        sessionId: selectedSession.id,
        rating,
        text: trimmedComment || undefined,
        flagReason: flagging ? trimmedFlag : undefined,
        recaptchaToken,
      });
      setSuccessMessage('Thank you! Your feedback was submitted.');
      setTimeout(() => {
        handleCloseModal();
      }, 900);
    } catch (submissionError) {
      logger.error('Submit feedback failed', submissionError);
      const apiMessage = (submissionError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(apiMessage || 'Unable to submit feedback. Please try again.');
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  const modalTitle = useMemo(() => {
    if (!selectedSession) return '';
    return `Share feedback for ${selectedSession.subject}`;
  }, [selectedSession]);

  return (
    <section className="tw-bg-white tw-rounded-2xl tw-shadow tw-border tw-border-gray-100 tw-p-6 tw-mb-8">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3 tw-mb-4">
        <div>
          <p className="tw-text-sm tw-font-semibold tw-text-purple-600 tw-uppercase">Feedback</p>
          <h2 className="tw-text-xl tw-font-bold tw-text-gray-900">Pending session feedback</h2>
        </div>
        {hasPending ? (
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-amber-50 tw-text-amber-700 tw-px-3 tw-py-1 tw-text-sm tw-font-medium">
            {pendingCount} waiting
          </span>
        ) : null}
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-6" aria-hidden="true">
        <div className="tw-rounded-2xl tw-bg-purple-50 tw-border tw-border-purple-100 tw-p-4">
          <p className="tw-text-xs tw-font-semibold tw-text-purple-700 tw-uppercase">Pending reviews</p>
          <p className="tw-text-3xl tw-font-bold tw-text-purple-900">{pendingCount}</p>
          <p className="tw-text-sm tw-text-purple-700">Awaiting your perspective</p>
        </div>
        <div className="tw-rounded-2xl tw-bg-blue-50 tw-border tw-border-blue-100 tw-p-4">
          <p className="tw-text-xs tw-font-semibold tw-text-blue-700 tw-uppercase">Mentors</p>
          <p className="tw-text-3xl tw-font-bold tw-text-blue-900">{uniqueMentorCount}</p>
          <p className="tw-text-sm tw-text-blue-700">Needing feedback</p>
        </div>
        <div className="tw-rounded-2xl tw-bg-gradient-to-r tw-from-amber-400 tw-to-orange-500 tw-text-white tw-p-4 tw-shadow-inner">
          {nextDueSession ? (
            <>
              <p className="tw-text-xs tw-font-semibold tw-uppercase">Next due</p>
              <p className="tw-text-lg tw-font-semibold">{formatDate(getDueDate(nextDueSession))}</p>
              {relativeDueText ? <p className="tw-text-sm tw-opacity-90">{relativeDueText}</p> : null}
              <p className="tw-text-sm tw-mt-2 tw-font-medium tw-opacity-90">{nextDueSession.subject}</p>
            </>
          ) : (
            <p className="tw-text-base tw-font-medium">You're ahead of schedule 🎉</p>
          )}
        </div>
      </div>

      {hasPending ? (
        <div className="tw-flex tw-flex-wrap tw-gap-4 tw-items-end tw-mb-6" role="search" aria-label="Filter pending sessions">
          <label htmlFor="pending-feedback-search" className="tw-flex-1 tw-min-w-[220px]">
            <span className="tw-text-xs tw-font-semibold tw-text-gray-600">Search sessions</span>
            <input
              id="pending-feedback-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by mentor or topic"
              className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            />
          </label>
          <label htmlFor="pending-feedback-sort" className="tw-w-full md:tw-w-48">
            <span className="tw-text-xs tw-font-semibold tw-text-gray-600">Sort by</span>
            <select
              id="pending-feedback-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as 'soonest' | 'latest' | 'mentor')}
              className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <option value="soonest">Soonest date</option>
              <option value="latest">Most recently completed</option>
              <option value="mentor">Mentor name</option>
            </select>
          </label>
          {filterApplied ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSortOrder('soonest');
              }}
              className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="tw-space-y-3" role="status" aria-live="polite" aria-label="Loading pending feedback">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="tw-h-16 tw-rounded-xl tw-bg-gray-100 tw-animate-pulse" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="tw-rounded-xl tw-border tw-border-red-200 tw-bg-red-50 tw-p-4 tw-flex tw-items-start tw-gap-3">
          <span className="tw-text-red-600" aria-hidden>⚠️</span>
          <div>
            <p className="tw-text-sm tw-text-red-800 tw-font-semibold">Unable to load pending feedback.</p>
            <p className="tw-text-sm tw-text-red-700 tw-mb-2">{apiError?.response?.data?.message || apiError?.message || 'Please try again.'}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="tw-inline-flex tw-items-center tw-gap-1 tw-text-sm tw-font-medium tw-text-red-700 hover:tw-text-red-900"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && !hasPending ? (
        <div className="tw-rounded-xl tw-border tw-border-green-200 tw-bg-green-50 tw-p-4">
          <p className="tw-text-sm tw-font-medium tw-text-green-800">You’re all caught up.</p>
          <p className="tw-text-sm tw-text-green-700">Complete a mentoring session to share feedback with your mentor.</p>
        </div>
      ) : null}

      {!isLoading && hasPending && filteredSessions.length === 0 ? (
        <div className="tw-rounded-xl tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-4" role="status" aria-live="polite">
          <p className="tw-text-sm tw-font-semibold tw-text-blue-900">No sessions match “{searchTerm.trim()}”.</p>
          <p className="tw-text-sm tw-text-blue-800 tw-mb-3">Try adjusting your search or sort preference.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSortOrder('soonest');
            }}
            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-blue-600 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-blue-700"
          >
            Reset filters
          </button>
        </div>
      ) : null}

      {!isLoading && filteredSessions.length > 0 ? (
        <ul className="tw-space-y-4">
          {filteredSessions.map((session) => (
            <li key={session.id} className="tw-border tw-border-gray-100 tw-rounded-xl tw-p-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
              <div>
                <p className="tw-text-base tw-font-semibold tw-text-gray-900">{session.subject}</p>
                <p className="tw-text-sm tw-text-gray-600">
                  {session.mentor.name} · Session on {formatDate(session.date)}
                </p>
                <p className="tw-text-xs tw-text-gray-500">
                  Feedback due {formatDate(getDueDate(session))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenModal(session)}
                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-purple-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500 focus:tw-ring-offset-2"
              >
                Give feedback
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selectedSession ? (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-gray-900/50 tw-p-4">
          <div className="tw-w-full tw-max-w-xl tw-rounded-2xl tw-bg-white tw-shadow-2xl tw-border tw-border-gray-100 tw-p-6" role="dialog" aria-modal="true">
            <div className="tw-flex tw-items-start tw-justify-between tw-mb-4">
              <div>
                <p className="tw-text-sm tw-text-gray-500">{selectedSession.mentor.name}</p>
                <h3 className="tw-text-xl tw-font-semibold tw-text-gray-900">{modalTitle}</h3>
                <p className="tw-text-xs tw-text-gray-500">{formatDate(selectedSession.date)}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="tw-text-gray-400 hover:tw-text-gray-600"
                aria-label="Close feedback form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="tw-space-y-4">
              {formError ? (
                <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700" role="alert">
                  {formError}
                </div>
              ) : null}
              {successMessage ? (
                <div className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-3 tw-text-sm tw-text-green-700" role="status">
                  {successMessage}
                </div>
              ) : null}

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Rate your mentor</label>
                <div className="tw-flex tw-gap-2" role="radiogroup" aria-label="Rate mentor">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="tw-cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        className="tw-sr-only"
                      />
                      <span className={`tw-text-3xl ${value <= rating ? 'tw-text-amber-400' : 'tw-text-gray-300'}`} aria-hidden>
                        ★
                      </span>
                      <span className="tw-sr-only">{value} star{value > 1 ? 's' : ''}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="feedback-comment" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Share feedback (optional)
                </label>
                <textarea
                  id="feedback-comment"
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                  placeholder="What was helpful? Anything we should improve?"
                />
                <p className="tw-text-right tw-text-xs tw-text-gray-400">{feedbackText.length}/2000</p>
              </div>

              <div className="tw-space-y-2">
                <label className="tw-flex tw-items-start tw-gap-2 tw-text-sm tw-font-medium tw-text-gray-700">
                  <input
                    type="checkbox"
                    className="tw-mt-1 tw-h-4 tw-w-4 tw-rounded tw-border-gray-300 tw-text-purple-600 focus:tw-ring-purple-500"
                    checked={flagging}
                    onChange={(event) => setFlagging(event.target.checked)}
                  />
                  Report an issue to the admin
                </label>
                {flagging ? (
                  <textarea
                    value={flagReason}
                    onChange={(event) => setFlagReason(event.target.value)}
                    rows={3}
                    className="tw-w-full tw-rounded-lg tw-border tw-border-amber-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-amber-400"
                    placeholder="Describe what happened so the admin team can review it."
                    maxLength={1000}
                    required
                  />
                ) : null}
              </div>

              <div>
                <RecaptchaFieldWithRef
                  ref={recaptchaRef}
                  onChange={(token: string | null) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                />
              </div>

              <div className="tw-flex tw-justify-end tw-gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                  disabled={submitFeedback.isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tw-rounded-lg tw-bg-purple-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 disabled:tw-opacity-60"
                  disabled={submitFeedback.isLoading}
                >
                  {submitFeedback.isLoading ? 'Submitting...' : 'Submit feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default PendingFeedbackList;
