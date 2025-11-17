import React from 'react';
import type { MatchSuggestion, MatchMeta } from '../types';

interface Props {
  matches: MatchSuggestion[];
  isLoading?: boolean;
  meta?: MatchMeta;
}

const statusColors: Record<string, string> = {
  suggested: 'tw-bg-blue-50 tw-text-blue-700',
  mentor_accepted: 'tw-bg-green-50 tw-text-green-700',
  mentee_accepted: 'tw-bg-amber-50 tw-text-amber-700',
  mentee_declined: 'tw-bg-rose-50 tw-text-rose-700',
  connected: 'tw-bg-emerald-50 tw-text-emerald-700',
};

const MenteeMatchesList: React.FC<Props> = ({ matches, isLoading, meta }) => {
  if (isLoading) {
    return <p className="tw-text-sm tw-text-gray-500">Loading activity…</p>;
  }

  if (!matches.length) {
    return <p className="tw-text-sm tw-text-gray-500">No activity yet. Accept a mentor suggestion to get started.</p>;
  }

  return (
    <div className="tw-space-y-2" aria-live="polite">
      {meta && (
        <p className="tw-text-xs tw-text-gray-500">
          {meta.awaitingMentee ?? 0} waiting on you · {meta.awaitingMentor ?? 0} waiting on mentor response
        </p>
      )}
      <ul className="tw-divide-y tw-divide-gray-200 tw-rounded-2xl tw-border tw-border-gray-100">
        {matches.map((match) => (
          <li key={match.id} className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-gap-3">
            <div>
              <p className="tw-font-medium tw-text-gray-900">{match.mentor?.name || 'Mentor match'}</p>
              <p className="tw-text-xs tw-text-gray-500">Score {match.score}</p>
            </div>
            <span
              className={`tw-text-xs tw-font-semibold tw-rounded-full tw-px-3 tw-py-1 ${
                statusColors[match.status] || 'tw-bg-gray-100 tw-text-gray-700'
              }`}
            >
              {match.status.replace('_', ' ')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MenteeMatchesList;
