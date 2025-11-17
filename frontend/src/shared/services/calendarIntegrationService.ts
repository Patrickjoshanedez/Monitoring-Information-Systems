import { apiClient } from '../config/apiClient';

export interface GoogleCalendarIntegrationStatus {
    connected: boolean;
    accountEmail?: string;
    calendarId?: string;
    lastSyncedAt?: string;
    lastError?: { code?: string; message?: string; occurredAt?: string | Date } | null;
    featureDisabled?: boolean;
    message?: string;
}

export const getGoogleCalendarStatus = async (): Promise<GoogleCalendarIntegrationStatus> => {
    const { data } = await apiClient.get('/integrations/google-calendar/status');
    return data?.integration as GoogleCalendarIntegrationStatus;
};

export const getGoogleCalendarAuthUrl = async (): Promise<string> => {
    const { data } = await apiClient.get('/integrations/google-calendar/auth-url');
    return data?.url as string;
};

export const disconnectGoogleCalendar = async (): Promise<void> => {
    await apiClient.post('/integrations/google-calendar/disconnect');
};
