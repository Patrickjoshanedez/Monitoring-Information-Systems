import React from 'react';
import type { MatchSuggestion } from '../types';

interface Props {
  suggestion: MatchSuggestion | null;
  open: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

const MenteeProfileModal: React.FC<Props> = ({ suggestion, open, onClose, onAccept, onDecline, isAccepting, isDeclining }) => {
  if (!open || !suggestion) return null;
  const { mentee } = suggestion;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-z-50" role="dialog" aria-modal="true">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-3xl tw-max-h-[90vh] tw-overflow-y-auto tw-p-6">
        <header className="tw-flex tw-justify-between tw-items-start tw-gap-4">
          <div>
            <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-900">{mentee.name}</h3>
            <p className="tw-text-sm tw-text-gray-500">{mentee.education?.program || 'Program not provided'}</p>
          </div>
          <button onClick={onClose} aria-label="Close profile" className="tw-text-gray-400 hover:tw-text-gray-600">
            ✕
          </button>
        </header>

        <section className="tw-mt-4 tw-space-y-4">
          {mentee.bio && (
            <p className="tw-text-gray-700 tw-leading-relaxed">{mentee.bio}</p>
          )}

          <div>
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">Availability</h4>
            <ul className="tw-text-sm tw-text-gray-600 tw-mt-2 tw-space-y-1">
              {(mentee.availabilitySlots || []).map((slot) => (
                <li key={`${slot.day}-${slot.start}`}>{`${slot.day?.toUpperCase()} • ${slot.start || 'N/A'} - ${slot.end || 'N/A'}`}</li>
              ))}
              {!mentee.availabilitySlots?.length && <li>No availability shared yet.</li>}
            </ul>
          </div>

          <div>
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">Interests</h4>
            <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
              {(mentee.interests || []).map((interest) => (
                <span key={interest} className="tw-bg-gray-100 tw-text-gray-700 tw-text-xs tw-rounded-full tw-px-3 tw-py-1">
                  {interest}
                </span>
              ))}
              {!mentee.interests?.length && <span className="tw-text-xs tw-text-gray-500">No interests listed.</span>}
            </div>
          </div>
        </section>

        <footer className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
          {onDecline && (
            <button
              type="button"
              onClick={onDecline}
              disabled={isDeclining}
              className="tw-border tw-border-red-200 tw-text-red-600 tw-rounded-full tw-px-4 tw-py-2 tw-text-sm hover:tw-bg-red-50 disabled:tw-opacity-50"
            >
              {isDeclining ? 'Declining...' : 'Decline'}
            </button>
          )}
          {onAccept && (
            <button
              type="button"
              onClick={onAccept}
              disabled={isAccepting}
              className="tw-bg-purple-600 tw-text-white tw-rounded-full tw-px-5 tw-py-2 tw-text-sm hover:tw-bg-purple-700 disabled:tw-opacity-50"
            >
              {isAccepting ? 'Accepting...' : 'Accept match'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default MenteeProfileModal;
