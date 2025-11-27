import { apiClient } from '../config/apiClient';

export type AnnouncementAudience = 'all' | 'mentees' | 'mentors';

export type AnnouncementDto = {
    id: string;
    title: string;
    body: string;
    summary?: string;
    category: string;
    isFeatured: boolean;
    audience: AnnouncementAudience;
    publishedAt: string;
};

export type AnnouncementUpdatePayload = {
    title?: string;
    body?: string;
    summary?: string;
    category?: string;
    isFeatured?: boolean;
    audience?: AnnouncementAudience;
    publishedAt?: string;
};

export const fetchAnnouncements = async (): Promise<AnnouncementDto[]> => {
    const { data } = await apiClient.get<{ announcements: AnnouncementDto[] }>('/announcements');
    return data.announcements ?? [];
};

export const updateAnnouncement = async (
    id: string,
    payload: AnnouncementUpdatePayload
): Promise<AnnouncementDto> => {
    const { data } = await apiClient.put<{ announcement: AnnouncementDto }>(`/announcements/${id}`, payload);
    return data.announcement;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
    await apiClient.delete(`/announcements/${id}`);
};
