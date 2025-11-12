import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProfile, updateMyProfile, uploadPhotoWithProgress, ProfilePayload } from '../services/profileApi';
import { useState } from 'react';

export const useMyProfile = () => {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateMentorProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProfilePayload) => {
      return updateMyProfile(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    }
  });
};

export const useUploadProfilePhoto = () => {
  const [progress, setProgress] = useState<number>(0);
  const mut = useMutation({
    mutationFn: async (file: File) => {
      setProgress(0);
      return uploadPhotoWithProgress(file, (p) => setProgress(p));
    }
  });
  return { ...mut, progress };
};
