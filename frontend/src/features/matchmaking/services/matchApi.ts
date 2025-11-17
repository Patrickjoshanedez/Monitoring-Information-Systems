import { apiClient } from '../../../shared/config/apiClient';
import { MatchAcceptResponse, MatchMeta, MatchSuggestion } from '../types';

interface ApiListResponse<T> {
  success: boolean;
  suggestions?: T;
  matches?: T;
  meta?: MatchMeta;
  match?: MatchSuggestion;
}

export const fetchMatchSuggestions = async (mentorId: string, limit = 10) => {
  const { data } = await apiClient.get<ApiListResponse<MatchSuggestion[]>>(
    `/mentors/${mentorId}/match-suggestions`,
    { params: { limit } }
  );
  return {
    suggestions: data.suggestions ?? [],
    meta: data.meta ?? ({ count: 0, capacity: null, activeMentees: null, remainingSlots: null } as MatchMeta),
  };
};

export const fetchMatchDetail = async (mentorId: string, matchId: string) => {
  const { data } = await apiClient.get<ApiListResponse<MatchSuggestion>>(
    `/mentors/${mentorId}/match-suggestions/${matchId}`
  );
  return data.match as MatchSuggestion;
};

export const acceptMatch = async (matchId: string, note?: string) => {
  const { data } = await apiClient.post<MatchAcceptResponse>(`/matches/${matchId}/accept`, note ? { note } : undefined);
  return data;
};

export const declineMatch = async (matchId: string, reason?: string) => {
  const { data } = await apiClient.post<MatchAcceptResponse>(`/matches/${matchId}/decline`, reason ? { reason } : undefined);
  return data.match;
};

export const menteeAcceptMatch = async (matchId: string) => {
  const { data } = await apiClient.post<MatchAcceptResponse>(`/matches/${matchId}/mentee-accept`);
  return data;
};

export const fetchMentorMatches = async (mentorId: string) => {
  const { data } = await apiClient.get<ApiListResponse<MatchSuggestion[]>>(`/mentors/${mentorId}/matches`);
  return {
    matches: data.matches ?? [],
    meta: data.meta ?? ({ count: 0, capacity: null, activeMentees: null, remainingSlots: null } as MatchMeta),
  };
};

export const fetchMenteeMatchSuggestions = async (menteeId: string, limit = 10) => {
  const { data } = await apiClient.get<ApiListResponse<MatchSuggestion[]>>(
    `/mentees/${menteeId}/match-suggestions`,
    { params: { limit } }
  );
  return {
    suggestions: data.suggestions ?? [],
    meta: data.meta ?? ({ count: 0, capacity: null, activeMentees: null, remainingSlots: null } as MatchMeta),
  };
};

export const fetchMenteeMatches = async (menteeId: string) => {
  const { data } = await apiClient.get<ApiListResponse<MatchSuggestion[]>>(`/mentees/${menteeId}/matches`);
  return {
    matches: data.matches ?? [],
    meta: data.meta ?? ({ count: 0, capacity: null, activeMentees: null, remainingSlots: null } as MatchMeta),
  };
};

export const menteeDeclineMatch = async (matchId: string, reason?: string) => {
  const { data } = await apiClient.post<MatchAcceptResponse>(
    `/matches/${matchId}/mentee-decline`,
    reason ? { reason } : undefined
  );
  return data.match;
};

export const regenerateSuggestions = async (mentorId?: string, limit?: number) => {
  const payload = { mentorId, limit };
  const { data } = await apiClient.post(`/matches/generate`, payload);
  return data;
};
