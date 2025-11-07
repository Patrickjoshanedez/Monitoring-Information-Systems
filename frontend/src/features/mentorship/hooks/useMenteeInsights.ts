import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMentorshipRequests, fetchMentorMeta } from '../../../shared/services/mentorMatching';

export type MenteeInsights = {
  totalRequests: number;
  pendingRequests: number;
  acceptedRequests: number;
  uniqueMentorsAccepted: number;
  matchRate: number; // 0-100
  pendingRate: number; // 0-100
  directoryCoverage: number; // 0-100 – proportion of mentors engaged (accepted) vs available
  upcomingSessions: Array<{
    id: string;
    subject: string;
    mentorName: string;
    sessionSuggestion: string | null;
    createdAt: string;
  }>;
};

const roundPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const useMenteeInsights = (): { insights: MenteeInsights; isLoading: boolean } => {
  const requestsQuery = useQuery({
    queryKey: ['mentorship-requests', 'mentee'],
    queryFn: () => fetchMentorshipRequests('mentee'),
    refetchInterval: 30 * 1000,
  });

  const metaQuery = useQuery({
    queryKey: ['mentor-meta'],
    queryFn: () => fetchMentorMeta(),
    staleTime: 5 * 60 * 1000,
  });

  const insights = useMemo<MenteeInsights>(() => {
    const total = requestsQuery.data?.meta?.total ?? 0;
    const pending = requestsQuery.data?.meta?.pending ?? 0;
    const accepted = (requestsQuery.data?.requests ?? []).filter((r) => r.status === 'accepted').length;
    const uniqueMentorsAccepted = new Set(
      (requestsQuery.data?.requests ?? [])
        .filter((r) => r.status === 'accepted' && r.mentor?.id)
        .map((r) => r.mentor.id as string)
    ).size;

    const matchRate = total > 0 ? (accepted / total) * 100 : 0;
    const pendingRate = total > 0 ? (pending / total) * 100 : 0;

    const availableMentors = metaQuery.data?.available ?? 0;
    const directoryCoverage = availableMentors > 0 ? (uniqueMentorsAccepted / availableMentors) * 100 : 0;

    const upcoming = (requestsQuery.data?.requests ?? [])
      .filter((r) => r.status === 'accepted')
      .map((r) => ({
        id: r.id,
        subject: r.subject,
        mentorName: r.mentor?.name || '—',
        sessionSuggestion: r.sessionSuggestion,
        createdAt: r.createdAt,
      }));

    return {
      totalRequests: total,
      pendingRequests: pending,
      acceptedRequests: accepted,
      uniqueMentorsAccepted,
      matchRate: roundPct(matchRate),
      pendingRate: roundPct(pendingRate),
      directoryCoverage: roundPct(directoryCoverage),
      upcomingSessions: upcoming,
    };
  }, [requestsQuery.data, metaQuery.data]);

  return { insights, isLoading: requestsQuery.isLoading || metaQuery.isLoading };
};

export default useMenteeInsights;
