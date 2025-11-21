import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import MatchDecisionToast from '../components/MatchDecisionToast';
import MenteeSuggestionCard from '../components/MenteeSuggestionCard';
import MenteeMatchesList from '../components/MenteeMatchesList';
import {
  useMenteeMatchSuggestions,
  useMenteeMatches,
  useMenteeAcceptMatch,
  useMenteeDeclineMatch,
} from '../hooks/useMatchSuggestions';

const MenteeMatchSuggestionsPage: React.FC = () => {
  const storedUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const menteeId = storedUser?._id || storedUser?.id || storedUser?.user?._id;
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const { data, isLoading, refetch } = useMenteeMatchSuggestions(menteeId, 20);
  const { data: matchesData, isLoading: matchesLoading } = useMenteeMatches(menteeId);
  const acceptMutation = useMenteeAcceptMatch(menteeId, 20);
  const declineMutation = useMenteeDeclineMatch(menteeId, 20);

  if (!menteeId) {
    return <p className="tw-text-center tw-text-gray-500">Mentee information missing. Please sign in again.</p>;
  }

  const suggestions = data?.suggestions ?? [];
  const matches = matchesData?.matches ?? [];
  const awaitingMentee = data?.meta?.awaitingMentee ?? 0;
  const awaitingMentor = data?.meta?.awaitingMentor ?? 0;

  const handleAccept = (matchId: string) => {
    acceptMutation.mutate(
      { matchId },
      {
        onSuccess: (result: any) => setToast({ message: result?.mentorship ? 'Match confirmed! Mentorship established.' : 'Accepted! Waiting for mentor confirmation.', variant: 'success' }),
        onError: (error: unknown) => setToast({ message: (error as Error)?.message || 'Unable to accept match.', variant: 'error' }),
      }
    );
  };

  const handleDecline = (matchId: string) => {
    declineMutation.mutate(
      { matchId },
      {
        onSuccess: () => setToast({ message: 'Declined suggestion', variant: 'info' }),
        onError: (error: unknown) => setToast({ message: (error as Error)?.message || 'Unable to decline match.', variant: 'error' }),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="tw-max-w-5xl tw-mx-auto tw-p-4 sm:tw-px-6 tw-py-8 tw-space-y-8">
        <header className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
          <div>
            <p className="tw-text-xs tw-uppercase tw-text-purple-500 tw-font-semibold">Match center</p>
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Mentor suggestions</h1>
            <p className="tw-text-sm tw-text-gray-500">Review potential mentors algorithmically matched to your goals.</p>
          </div>
          <div className="tw-text-sm tw-text-gray-500 tw-space-y-1">
            <p>Awaiting your response: {awaitingMentee}</p>
            <p>Awaiting mentor response: {awaitingMentor}</p>
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
          <p className="tw-text-sm tw-text-gray-500">Loading suggestions…</p>
        ) : (
          <div className="tw-grid tw-grid-cols-1 tw-gap-6">
            {suggestions.map((suggestion) => (
              <MenteeSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion.id)}
                onDecline={() => handleDecline(suggestion.id)}
                isAccepting={acceptMutation.isPending}
                isDeclining={declineMutation.isPending}
              />
            ))}
            {!suggestions.length && (
              <p className="tw-text-sm tw-text-gray-500">No mentor suggestions yet. We will notify you as soon as new matches are ready.</p>
            )}
          </div>
        )}

        <section className="tw-space-y-3">
          <header className="tw-flex tw-items-center tw-justify-between">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Recent activity</h2>
          </header>
          <MenteeMatchesList matches={matches} isLoading={matchesLoading} meta={data?.meta} />
        </section>
      </div>

      {toast && <MatchDecisionToast message={toast.message} variant={toast.variant} />}
    </DashboardLayout>
  );
};

export default MenteeMatchSuggestionsPage;
