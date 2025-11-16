import React, { useMemo } from 'react';
import type { AxiosError } from 'axios';
import { useMentorFeedbackSummary } from '../../shared/hooks/useSessionFeedback';
import logger from '../../shared/utils/logger';

type StoredUser = {
  _id?: string;
  id?: string;
  firstname?: string;
  lastname?: string;
};

const readStoredUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    logger.error('Unable to parse stored user', error);
    return null;
  }
};

const OverviewMetrics: React.FC = () => {
  const storedUser = useMemo(() => readStoredUser(), []);
  const mentorId = storedUser?._id || storedUser?.id || null;
  const displayName = useMemo(() => {
    if (!storedUser) {
      return null;
    }
    const parts = [storedUser.firstname, storedUser.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  }, [storedUser]);

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMentorFeedbackSummary(mentorId);

  const ratingValue = summary?.ratingAvg ?? null;
  const reviewCount = summary?.ratingCount ?? 0;
  const ratingLabel = ratingValue ? ratingValue.toFixed(1) : '—';
  const qualitativeLabel = useMemo(() => {
    if (!ratingValue || reviewCount === 0) {
      return 'No feedback yet';
    }
    if (ratingValue >= 4.5) {
      return 'Exceptional feedback';
    }
    if (ratingValue >= 4.0) {
      return 'Strong feedback';
    }
    if (ratingValue >= 3.0) {
      return 'Mixed feedback';
    }
    return 'Needs attention';
  }, [ratingValue, reviewCount]);

  if (!mentorId) {
    return (
      <section className="tw-bg-white tw-rounded-2xl tw-shadow tw-border tw-border-gray-100 tw-p-6">
        <p className="tw-text-base tw-font-semibold tw-text-gray-900">Feedback summary unavailable</p>
        <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
          Sign in with a mentor account to view live rating insights.
        </p>
      </section>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="tw-flex tw-items-center tw-gap-4" role="status" aria-live="polite">
          <div className="tw-h-20 tw-w-20 tw-rounded-2xl tw-bg-gray-100 tw-animate-pulse" />
          <div className="tw-flex-1 tw-space-y-3">
            <div className="tw-h-4 tw-rounded tw-bg-gray-100 tw-animate-pulse" />
            <div className="tw-h-4 tw-rounded tw-bg-gray-100 tw-animate-pulse" />
            <div className="tw-h-4 tw-rounded tw-bg-gray-100 tw-animate-pulse" />
          </div>
        </div>
      );
    }

    if (isError) {
      const apiError = error as AxiosError<{ message?: string }> | null;
      return (
        <div className="tw-rounded-xl tw-border tw-border-red-200 tw-bg-red-50 tw-p-4" role="alert">
          <p className="tw-text-sm tw-font-semibold tw-text-red-800">Unable to load your feedback summary.</p>
          <p className="tw-text-sm tw-text-red-700 tw-mt-1">{apiError?.response?.data?.message || apiError?.message || 'Please try again.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="tw-mt-3 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-red-200 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-red-700 hover:tw-border-red-300"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4" aria-live="polite">
        <div className="tw-rounded-2xl tw-border tw-border-gray-100 tw-bg-gradient-to-br tw-from-purple-600 tw-to-indigo-500 tw-text-white tw-p-5">
          <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-opacity-80">Average rating</p>
          <div className="tw-flex tw-items-baseline tw-gap-2">
            <span className="tw-text-4xl tw-font-bold">{ratingLabel}</span>
            <span className="tw-text-sm tw-opacity-80">/ 5</span>
          </div>
          <p className="tw-text-sm tw-mt-1 tw-font-medium">{qualitativeLabel}</p>
        </div>
        <div className="tw-rounded-2xl tw-border tw-border-gray-100 tw-bg-gray-50 tw-p-5 tw-flex tw-flex-col tw-justify-between">
          <div>
            <p className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase">Total reviews</p>
            <p className="tw-text-3xl tw-font-bold tw-text-gray-900">{reviewCount}</p>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              {reviewCount === 0 ? 'Awaiting first review' : 'Based on mentee feedback in the last window'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="tw-self-end tw-mt-4 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-purple-700 hover:tw-text-purple-900"
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh summary'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="tw-bg-white tw-rounded-2xl tw-shadow tw-border tw-border-gray-100 tw-p-6 tw-space-y-4">
      <div className="tw-space-y-1">
        <p className="tw-text-xs tw-font-semibold tw-text-purple-600 tw-uppercase">Feedback</p>
        <h2 className="tw-text-xl tw-font-bold tw-text-gray-900">Session feedback summary</h2>
        {displayName ? (
          <p className="tw-text-sm tw-text-gray-600">Insights for {displayName}</p>
        ) : null}
      </div>
      {renderContent()}
    </section>
  );
};

export default OverviewMetrics;
