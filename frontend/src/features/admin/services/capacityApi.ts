import { apiClient } from '../../../shared/config/apiClient';

export interface MentorCapacityRow {
  id: string;
  name: string;
  email: string;
  capacity: number | null;
  activeMentees: number;
  remainingSlots: number | null;
  updatedAt?: string;
}

interface CapacityListResponse {
  success: boolean;
  mentors: MentorCapacityRow[];
  meta?: { count: number };
}

interface CapacityUpdateResponse {
  success: boolean;
  mentor: MentorCapacityRow;
}

export const fetchMentorCapacities = async () => {
  const { data } = await apiClient.get<CapacityListResponse>('/admin/mentors/capacity');
  return data.mentors || [];
};

export const postMentorCapacity = async (
  mentorId: string,
  payload: { capacity: number; reason?: string }
): Promise<MentorCapacityRow> => {
  const { data } = await apiClient.patch<CapacityUpdateResponse>(`/admin/mentors/${mentorId}/capacity`, payload);
  return data.mentor;
};
