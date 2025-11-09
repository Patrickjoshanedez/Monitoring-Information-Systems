import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoleSelectModal({ open, onClose }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center">
      <div className="tw-absolute tw-inset-0 tw-backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-p-8 tw-w-[min(520px,90%)]">
        <button
          aria-label="Close"
          className="tw-absolute tw-top-4 tw-right-4 tw-text-gray-500 hover:tw-text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="tw-text-2xl tw-font-bold tw-mb-4">Are you registering as a Mentee, Mentor, or Admin?</h2>
        <div className="tw-flex tw-gap-4 tw-justify-center">
          <button onClick={() => go('/mentee-application')} className="tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-px-6 tw-py-3 tw-rounded-lg">Mentee</button>
          <button onClick={() => go('/mentor-application')} className="tw-border tw-border-purple-600 tw-text-purple-600 tw-px-6 tw-py-3 tw-rounded-lg">Mentor</button>
          <button onClick={() => go('/admin-application')} className="tw-border tw-border-gray-300 tw-text-gray-700 tw-px-6 tw-py-3 tw-rounded-lg">Admin</button>
        </div>
      </div>
    </div>
  );
}
