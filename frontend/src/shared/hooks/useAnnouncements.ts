import { useQuery } from '@tanstack/react-query';
import { AnnouncementDto, fetchAnnouncements } from '../services/announcementsService';

export const ANNOUNCEMENTS_QUERY_KEY = ['announcements'] as const;

export const useAnnouncements = () => {
    const query = useQuery<AnnouncementDto[]>({
        queryKey: ANNOUNCEMENTS_QUERY_KEY,
        queryFn: fetchAnnouncements,
        staleTime: 5 * 60 * 1000,
    });

    return {
        announcements: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
    };
};

export default useAnnouncements;
