import { apiClient } from '../config/apiClient';

export interface PendingFeedbackSession {
  id: string;
  subject: string;
  mentor: {
    id: string | null;
    name: string;
  };
  date: string;
}

export interface SubmitFeedbackPayload {
  sessionId: string;
  rating: number;
  comment?: string;
  flagReason?: string;
  recaptchaToken?: string;
}

export interface MentorFeedbackSummary {
  summary: {
    averageRating: number;
    totalReviews: number;
    lastReviewAt: string | null;
  };
  recent: Array<{
    code: string;
    rating: number;
    comment: string | null;
    submittedAt: string;
  }>;
}

export const fetchPendingFeedbackSessions = async () => {
  const { data } = await apiClient.get<{ pending: PendingFeedbackSession[] }>('/feedback/pending');
  return data.pending;
};

export const submitSessionFeedback = async ({ sessionId, ...payload }: SubmitFeedbackPayload) => {
  const { data } = await apiClient.post(`/feedback/sessions/${sessionId}`, payload);
  return data;
};

export const fetchMentorFeedbackSummary = async (mentorId: string) => {
  const { data } = await apiClient.get<MentorFeedbackSummary>(`/feedback/mentor/${mentorId}/summary`);
  return data;
};
