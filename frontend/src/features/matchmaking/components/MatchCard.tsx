import React from 'react';
import type { MatchSuggestion } from '../types';

interface MatchCardProps {
  suggestion: MatchSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  disableAccept?: boolean;
  isAccepting?: boolean;
  isDeclining?: boolean;
  onViewProfile?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  suggestion,
  onAccept,
  onDecline,
  disableAccept,
  isAccepting,
  isDeclining,
  onViewProfile,
}) => {
  const { mentee, score, scoreBreakdown, status } = suggestion;
  const statusLabel = status.replace('_', ' ');

  return (
    <article className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-6 tw-flex tw-flex-col tw-gap-4">
      <header className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          {mentee.photoUrl ? (
            <img src={mentee.photoUrl} alt={mentee.name} className="tw-w-12 tw-h-12 tw-rounded-full tw-object-cover" />
          ) : (
            <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-purple-100 tw-text-purple-600 tw-flex tw-items-center tw-justify-center tw-font-semibold">
              {mentee.name?.[0] ?? '?'}
            </div>
          )}
          <div>
            <p className="tw-font-semibold tw-text-gray-900">{mentee.name}</p>
            <p className="tw-text-sm tw-text-gray-500">{mentee.education?.program || 'Program not provided'}</p>
          </div>
        </div>
        <div className="tw-text-right">
          <p className="tw-text-xs tw-uppercase tw-text-gray-400">score</p>
          <p className="tw-text-2xl tw-font-bold tw-text-purple-600">{score}</p>
          <p className="tw-text-xs tw-text-gray-500 tw-mt-1">{statusLabel}</p>
        </div>
      </header>

      <section className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-3" aria-label="Score breakdown">
        {Object.entries(scoreBreakdown).map(([key, value]) => (
          <div key={key} className="tw-bg-gray-50 tw-rounded-xl tw-p-3">
            <p className="tw-text-xs tw-uppercase tw-text-gray-400">{key}</p>
            <p className="tw-font-semibold tw-text-gray-900">{value}</p>
          </div>
        ))}
      </section>

      <section>
        <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">Focus areas</h4>
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
          {(mentee.expertiseAreas || mentee.skills || []).slice(0, 4).map((tag) => (
            <span key={tag} className="tw-text-xs tw-bg-purple-50 tw-text-purple-700 tw-px-3 tw-py-1 tw-rounded-full">
              {tag}
            </span>
          ))}
          {!mentee.expertiseAreas?.length && !mentee.skills?.length && (
            <span className="tw-text-xs tw-text-gray-500">No tags provided</span>
          )}
        </div>
      </section>

      <footer className="tw-flex tw-flex-wrap tw-gap-3 tw-justify-end">
        {onViewProfile && (
          <button
            type="button"
            onClick={onViewProfile}
            className="tw-border tw-border-gray-300 tw-text-gray-700 tw-rounded-full tw-px-4 tw-py-2 tw-text-sm hover:tw-bg-gray-50"
          >
            View profile
          </button>
        )}
        <button
          type="button"
          onClick={onDecline}
          disabled={isDeclining}
          className="tw-border tw-border-red-200 tw-text-red-600 tw-rounded-full tw-px-4 tw-py-2 tw-text-sm hover:tw-bg-red-50 disabled:tw-opacity-50"
        >
          {isDeclining ? 'Declining...' : 'Decline'}
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={disableAccept || isAccepting}
          className="tw-bg-purple-600 tw-text-white tw-rounded-full tw-px-5 tw-py-2 tw-text-sm hover:tw-bg-purple-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
        >
          {disableAccept ? 'Capacity reached' : isAccepting ? 'Accepting...' : 'Accept'}
        </button>
      </footer>
    </article>
  );
};

export default MatchCard;
