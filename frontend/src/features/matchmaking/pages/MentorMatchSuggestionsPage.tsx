import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import MatchCard from '../components/MatchCard';
import MenteeProfileModal from '../components/MenteeProfileModal';
import MatchDecisionToast from '../components/MatchDecisionToast';
import MentorMatchesList from '../components/MentorMatchesList';
import {
  useMatchSuggestions,
  useAcceptMatch,
  useDeclineMatch,
  useMentorMatches,
  useCapacityInfo,
} from '../hooks/useMatchSuggestions';
import type { MatchSuggestion } from '../types';

const MentorMatchSuggestionsPage: React.FC = () => {
  const storedUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const mentorId = storedUser?._id || storedUser?.id || storedUser?.user?._id;
  const [selected, setSelected] = useState<MatchSuggestion | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const { data, isLoading, refetch } = useMatchSuggestions(mentorId, 10);
  const { data: matchesData, isLoading: matchesLoading } = useMentorMatches(mentorId);
  const capacityInfo = useCapacityInfo(data?.meta);

  const acceptMutation = useAcceptMatch(mentorId);
  const declineMutation = useDeclineMatch(mentorId);

  const handleAccept = (matchId: string) => {
    acceptMutation.mutate(
      { matchId },
      {
        onSuccess: () => {
          setToast({ message: 'Accepted — awaiting mentee confirmation', variant: 'success' });
        },
        onError: (error: unknown) => {
          setToast({ message: (error as Error)?.message || 'Unable to accept match', variant: 'error' });
        },
      }
    );
  };

  const handleDecline = (matchId: string) => {
    declineMutation.mutate(
      { matchId },
      {
        onSuccess: () => setToast({ message: 'Declined match suggestion', variant: 'info' }),
        onError: (error: unknown) => setToast({ message: (error as Error)?.message || 'Unable to decline match', variant: 'error' }),
      }
    );
  };

  if (!mentorId) {
    return <p className="tw-text-center tw-text-gray-500">Mentor information missing. Please sign in again.</p>;
  }

  const suggestions = data?.suggestions ?? [];
  const matches = matchesData?.matches ?? [];

  return (
    <DashboardLayout>
      <div className="tw-max-w-6xl tw-mx-auto tw-p-4 sm:tw-px-6 tw-py-8 tw-space-y-8">
        <header className="tw-flex tw-flex-wrap tw-justify-between tw-gap-4 tw-items-start">
          <div>
            <p className="tw-text-sm tw-uppercase tw-text-purple-500 tw-font-semibold">Match Center</p>
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Suggested mentees</h1>
            <p className="tw-text-sm tw-text-gray-500">
              Review algorithmic matches ranked by expertise overlap, availability, and priority.
            </p>
          </div>
          <div className="tw-text-sm tw-text-gray-500 tw-space-y-1">
            <p>Capacity: {capacityInfo.capacity ?? '—'} mentees</p>
            <p>Active mentees: {capacityInfo.active ?? '—'}</p>
            <p>Remaining slots: {capacityInfo.remaining ?? '—'}</p>
            <button
              type="button"
              className="tw-text-purple-600 tw-font-semibold hover:tw-text-purple-700"
              onClick={() => refetch()}
            >
              Refresh list
            </button>
          </div>
        </header>

        {isLoading ? (
          <p className="tw-text-sm tw-text-gray-500">Loading suggestions...</p>
        ) : (
          <div className="tw-grid tw-grid-cols-1 tw-gap-6">
            {suggestions.map((suggestion) => (
              <MatchCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion.id)}
                onDecline={() => handleDecline(suggestion.id)}
                disableAccept={capacityInfo.remaining !== null && capacityInfo.remaining <= 0 && suggestion.status !== 'mentor_accepted'}
                isAccepting={acceptMutation.isPending}
                isDeclining={declineMutation.isPending}
                onViewProfile={() => setSelected(suggestion)}
              />
            ))}
            {!suggestions.length && <p className="tw-text-sm tw-text-gray-500">No suggestions yet. Try refreshing later.</p>}
          </div>
        )}

        <section className="tw-space-y-3">
          <header className="tw-flex tw-items-center tw-justify-between">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Recent match activity</h2>
          </header>
          <MentorMatchesList matches={matches} isLoading={matchesLoading} meta={matchesData?.meta} />
        </section>
      </div>

      <MenteeProfileModal
        suggestion={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onAccept={selected ? () => handleAccept(selected.id) : undefined}
        onDecline={selected ? () => handleDecline(selected.id) : undefined}
        isAccepting={acceptMutation.isPending}
        isDeclining={declineMutation.isPending}
      />

      {toast && <MatchDecisionToast message={toast.message} variant={toast.variant} />}
    </DashboardLayout>
  );
};

export default MentorMatchSuggestionsPage;
