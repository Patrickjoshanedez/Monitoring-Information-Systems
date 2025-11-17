import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  acceptMatch,
  declineMatch,
  fetchMatchSuggestions,
  fetchMentorMatches,
  fetchMenteeMatchSuggestions,
  fetchMenteeMatches,
  menteeAcceptMatch,
  menteeDeclineMatch,
} from '../services/matchApi';
import { MatchSuggestion } from '../types';

const suggestionsKey = (mentorId?: string, limit?: number) => ['matchSuggestions', mentorId, limit];
const matchesKey = (mentorId?: string) => ['mentorMatches', mentorId];
const menteeSuggestionsKey = (menteeId?: string, limit?: number) => ['menteeMatchSuggestions', menteeId, limit];
const menteeMatchesKey = (menteeId?: string) => ['menteeMatches', menteeId];

export const useMatchSuggestions = (mentorId?: string, limit = 10) => {
  return useQuery({
    queryKey: suggestionsKey(mentorId, limit),
    queryFn: () => fetchMatchSuggestions(mentorId as string, limit),
    enabled: Boolean(mentorId),
  });
};

export const useMentorMatches = (mentorId?: string) => {
  return useQuery({
    queryKey: matchesKey(mentorId),
    queryFn: () => fetchMentorMatches(mentorId as string),
    enabled: Boolean(mentorId),
  });
};

export const useAcceptMatch = (mentorId?: string, limit = 10) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, note }: { matchId: string; note?: string }) => acceptMatch(matchId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(mentorId, limit) });
      queryClient.invalidateQueries({ queryKey: matchesKey(mentorId) });
    },
  });
};

export const useDeclineMatch = (mentorId?: string, limit = 10) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, reason }: { matchId: string; reason?: string }) => declineMatch(matchId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey(mentorId, limit) });
      queryClient.invalidateQueries({ queryKey: matchesKey(mentorId) });
    },
  });
};

export const useMenteeMatchSuggestions = (menteeId?: string, limit = 10) => {
  return useQuery({
    queryKey: menteeSuggestionsKey(menteeId, limit),
    queryFn: () => fetchMenteeMatchSuggestions(menteeId as string, limit),
    enabled: Boolean(menteeId),
  });
};

export const useMenteeMatches = (menteeId?: string) => {
  return useQuery({
    queryKey: menteeMatchesKey(menteeId),
    queryFn: () => fetchMenteeMatches(menteeId as string),
    enabled: Boolean(menteeId),
  });
};

export const useMenteeAcceptMatch = (menteeId?: string, limit = 10) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId }: { matchId: string }) => menteeAcceptMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menteeSuggestionsKey(menteeId, limit) });
      queryClient.invalidateQueries({ queryKey: menteeMatchesKey(menteeId) });
    },
  });
};

export const useMenteeDeclineMatch = (menteeId?: string, limit = 10) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, reason }: { matchId: string; reason?: string }) => menteeDeclineMatch(matchId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menteeSuggestionsKey(menteeId, limit) });
      queryClient.invalidateQueries({ queryKey: menteeMatchesKey(menteeId) });
    },
  });
};

export const useCapacityInfo = (meta?: { capacity: number | null; activeMentees: number | null }) => {
  if (!meta) {
    return { remaining: null, capacity: null, active: null };
  }
  const capacity = typeof meta.capacity === 'number' ? meta.capacity : null;
  const active = typeof meta.activeMentees === 'number' ? meta.activeMentees : null;
  const remaining = capacity !== null && active !== null ? Math.max(capacity - active, 0) : null;
  return { capacity, active, remaining };
};
export type MatchMutationResult = { match: MatchSuggestion; mentorship?: { _id: string } | null };
