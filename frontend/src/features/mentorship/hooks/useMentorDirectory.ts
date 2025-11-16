import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMentorDirectory,
  MentorDirectoryMeta,
  MentorFilters,
  MentorProfile,
  MentorshipRequestPayload,
  requestMentorship,
} from '../../../shared/services/mentorMatching';

const DIRECTORY_QUERY_KEY = ['mentor-directory'];
const REQUESTS_QUERY_KEY = ['mentorship-requests'];

const DEFAULT_FILTERS: Required<Pick<MentorFilters, 'search' | 'subject' | 'availability' | 'language' | 'minRating'>> = {
  search: '',
  subject: '',
  availability: '',
  language: '',
  minRating: 0,
};

export type MentorDirectoryHook = {
  mentors: MentorProfile[];
  filters: typeof DEFAULT_FILTERS;
  setFilter: <K extends keyof typeof DEFAULT_FILTERS>(key: K, value: typeof DEFAULT_FILTERS[K]) => void;
  resetFilters: () => void;
  options: {
    subjects: string[];
    languages: string[];
    availability: string[];
    ratings: number[];
  };
  meta?: MentorDirectoryMeta;
  directorySource: MentorDirectoryMeta['source'];
  isFallback: boolean;
  isLoading: boolean;
  isRefetching: boolean;
  submitRequest: (payload: MentorshipRequestPayload) => Promise<unknown>;
  isSubmittingRequest: boolean;
};

export const useMentorDirectory = (): MentorDirectoryHook => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: [...DIRECTORY_QUERY_KEY, filters],
    queryFn: () => fetchMentorDirectory(filters),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  const mentors = queryResult.data?.mentors ?? [];
  const directorySource = queryResult.data?.meta?.source ?? 'api';
  const isFallback = directorySource === 'fallback';

  const options = useMemo(() => {
    const subjects = new Set<string>();
    const languages = new Set<string>();
    const availability = new Set<string>();

    mentors.forEach((mentor) => {
      mentor.subjects.forEach((subject) => subjects.add(subject));
      mentor.languages.forEach((language) => languages.add(language));
      mentor.availability.forEach((slot) => availability.add(slot));
    });

    return {
      subjects: Array.from(subjects).sort(),
      languages: Array.from(languages).sort(),
      availability: Array.from(availability).sort(),
      ratings: [5, 4.5, 4, 3.5, 3],
    };
  }, [mentors]);

  const setFilter = useCallback(<K extends keyof typeof DEFAULT_FILTERS>(key: K, value: typeof DEFAULT_FILTERS[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const mutation = useMutation({
    mutationFn: (payload: MentorshipRequestPayload) => requestMentorship(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECTORY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...REQUESTS_QUERY_KEY, 'mentee'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const submitRequest = useCallback(
    async (payload: MentorshipRequestPayload) => {
      const result = await mutation.mutateAsync(payload);
      return result;
    },
    [mutation]
  );

  return {
    mentors,
    filters,
    setFilter,
    resetFilters,
    options,
    meta: queryResult.data?.meta,
    directorySource,
    isFallback,
    isLoading: queryResult.isLoading,
    isRefetching: queryResult.isFetching,
    submitRequest,
    isSubmittingRequest: mutation.isPending,
  };
};

export default useMentorDirectory;
