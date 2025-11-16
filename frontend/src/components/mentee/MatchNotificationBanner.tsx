import React, { useCallback, useMemo } from 'react';
import useNotifications from '../../shared/hooks/useNotifications';
import { NotificationItem } from '../../shared/services/notificationService';

const MatchNotificationBanner: React.FC = () => {
  const {
    notifications,
    isLoading,
    error,
    markRead,
    isMarkingRead,
  } = useNotifications({ type: 'session', subscribe: true, limit: 25 });

  const latestMatch = useMemo(() => {
    const matches = notifications
      .filter((notification: NotificationItem) => notification.type === 'MENTORSHIP_MATCHED' && !notification.readAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matches[0] || null;
  }, [notifications]);

  const onDismiss = useCallback(() => {
    if (latestMatch?.id && !isMarkingRead) {
      markRead(latestMatch.id);
    }
  }, [latestMatch, isMarkingRead, markRead]);

  if (isLoading || error || !latestMatch) {
    return null;
  }

  return (
    <div className="tw-mb-4 tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-4" role="status" aria-live="polite">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-flex tw-items-start tw-gap-3">
          <span className="tw-text-green-600" aria-hidden>🎉</span>
          <div>
            <h3 className="tw-text-green-800 tw-font-semibold">{latestMatch.title || 'You have a new mentor match'}</h3>
            <p className="tw-text-green-700 tw-text-sm tw-mt-1">{latestMatch.message}</p>
            <div className="tw-mt-3 tw-flex tw-gap-2">
              <a
                href="/mentee/my-mentor"
                className="tw-inline-flex tw-items-center tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-white tw-bg-green-600 hover:tw-bg-green-700 tw-rounded"
              >
                View mentor
              </a>
              <a
                href="/mentee/session"
                className="tw-inline-flex tw-items-center tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-green-700 tw-border tw-border-green-300 hover:tw-bg-green-100 tw-rounded"
              >
                Schedule session
              </a>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="tw-text-green-700 hover:tw-text-green-900 tw-text-sm"
          aria-label="Dismiss match notification"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default React.memo(MatchNotificationBanner);
