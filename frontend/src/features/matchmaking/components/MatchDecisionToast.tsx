import React from 'react';

interface Props {
  message: string;
  variant?: 'success' | 'error' | 'info';
}

const colors: Record<string, string> = {
  success: 'tw-bg-emerald-50 tw-text-emerald-700 tw-border tw-border-emerald-100',
  error: 'tw-bg-red-50 tw-text-red-700 tw-border tw-border-red-100',
  info: 'tw-bg-blue-50 tw-text-blue-700 tw-border tw-border-blue-100',
};

const MatchDecisionToast: React.FC<Props> = ({ message, variant = 'info' }) => {
  if (!message) return null;
  return (
    <div className={`tw-fixed tw-bottom-6 tw-right-6 tw-rounded-2xl tw-shadow-lg tw-px-4 tw-py-3 tw-text-sm tw-font-medium ${colors[variant]}`}>
      {message}
    </div>
  );
};

export default MatchDecisionToast;
