import { useQuery } from '@tanstack/react-query';
import { fetchMentorRoster, MentorRosterEntry } from '../services/mentorService';

export const mentorRosterQueryKey = ['mentor', 'roster'];

export const useMentorRoster = () =>
    useQuery<MentorRosterEntry[]>(mentorRosterQueryKey, fetchMentorRoster, {
        staleTime: 5 * 60_000,
        cacheTime: 10 * 60_000,
    });
