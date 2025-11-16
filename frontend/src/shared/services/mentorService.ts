import { apiClient } from '../config/apiClient';

export interface MentorRosterEntry {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
}

interface MentorRosterResponse {
    success: boolean;
    mentees: MentorRosterEntry[];
}

export const fetchMentorRoster = async (): Promise<MentorRosterEntry[]> => {
    const { data } = await apiClient.get<MentorRosterResponse>('/mentor/mentees');
    return data.mentees || [];
};
