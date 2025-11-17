import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const statusStyles = {
  success: 'tw-text-green-700 tw-bg-green-50 tw-border-green-200',
  error: 'tw-text-red-700 tw-bg-red-50 tw-border-red-200',
};

export default function GoogleCalendarCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const status = (params.get('status') || 'success').toLowerCase();
  const message = params.get('message') || (status === 'success' ? 'Google Calendar connected successfully.' : 'Unable to connect Google Calendar.');

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/profile/settings', { replace: true });
    }, 3500);
    return () => clearTimeout(timeout);
  }, [navigate]);

  const goToSettings = () => navigate('/profile/settings', { replace: true });

  return (
    <div className="tw-min-h-screen tw-bg-gray-50 tw-flex tw-items-center tw-justify-center tw-p-4">
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-shadow-sm tw-max-w-md tw-w-full tw-p-6 tw-space-y-4">
        <div className={`tw-rounded-lg tw-border tw-p-4 ${statusStyles[status] || statusStyles.error}`} role="status" aria-live="polite">
          <p className="tw-text-base tw-font-semibold">{status === 'success' ? 'Google Calendar connected' : 'Google Calendar error'}</p>
          <p className="tw-text-sm tw-mt-1">{message}</p>
        </div>
        <p className="tw-text-sm tw-text-gray-600">You&apos;ll be redirected to your profile settings in a moment. You can also continue manually.</p>
        <button
          type="button"
          onClick={goToSettings}
          className="tw-w-full tw-rounded-lg tw-bg-purple-600 tw-text-white tw-py-2 tw-font-medium hover:tw-bg-purple-700 focus:tw-ring-2 focus:tw-ring-purple-500"
        >
          Go to profile settings
        </button>
      </div>
    </div>
  );
}
