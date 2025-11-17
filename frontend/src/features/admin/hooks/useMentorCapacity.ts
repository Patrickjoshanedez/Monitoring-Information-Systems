import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMentorCapacities, MentorCapacityRow, postMentorCapacity } from '../services/capacityApi';

const capacityKey = ['admin', 'mentorCapacity'];

export const useMentorCapacities = () => {
  return useQuery<MentorCapacityRow[]>({
    queryKey: capacityKey,
    queryFn: fetchMentorCapacities,
  });
};

export const useOverrideCapacity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mentorId, capacity, reason }: { mentorId: string; capacity: number; reason?: string }) =>
      postMentorCapacity(mentorId, { capacity, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: capacityKey });
    },
  });
};
