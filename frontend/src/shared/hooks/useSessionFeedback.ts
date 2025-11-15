import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  fetchMentorFeedbackSummary,
  fetchPendingFeedbackSessions,
  PendingFeedbackSession,
  submitSessionFeedback,
  SubmitFeedbackPayload,
  MentorFeedbackSummary,
} from '../services/feedbackService';

const pendingFeedbackKey = ['feedback', 'pending'];

export const usePendingFeedbackSessions = () => {
  return useQuery<PendingFeedbackSession[], AxiosError>({
    queryKey: pendingFeedbackKey,
    queryFn: fetchPendingFeedbackSessions,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSubmitSessionFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitFeedbackPayload) => submitSessionFeedback(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingFeedbackKey });
    },
  });
};

export const useMentorFeedbackSummary = (mentorId?: string | null) => {
  return useQuery<MentorFeedbackSummary, AxiosError>({
    queryKey: ['feedback', 'summary', mentorId],
    queryFn: () => fetchMentorFeedbackSummary(mentorId as string),
    enabled: Boolean(mentorId),
    staleTime: 5 * 60 * 1000,
  });
};
