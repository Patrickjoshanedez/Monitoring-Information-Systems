import { apiClient } from '../config/apiClient';

export type AnnouncementDto = {
    id: string;
    title: string;
    body: string;
    summary?: string;
    category: string;
    isFeatured: boolean;
    audience: 'all' | 'mentees' | 'mentors';
    publishedAt: string;
};

export const fetchAnnouncements = async (): Promise<AnnouncementDto[]> => {
    const { data } = await apiClient.get<{ announcements: AnnouncementDto[] }>('/announcements');
    return data.announcements ?? [];
};
