import { apiClient } from '../config/apiClient';

const CERTIFICATE_TIMEOUT = 45000;
const CERTIFICATE_DOWNLOAD_TIMEOUT = 60000;

export interface CertificateSummary {
    id: string;
    programName: string;
    cohort?: string | null;
    certificateType: string;
    status: string;
    issuedAt: string;
    mentorId?: string | null;
    mentorName?: string | null;
    menteeId?: string | null;
    menteeName?: string;
    menteeStudentId?: string | null;
    serialNumber: string;
    verificationCode: string;
    verificationUrl?: string;
    pdfUrl?: string;
    reissueCount?: number;
}

export interface IssueCertificatePayload {
    programName: string;
    certificateType?: 'participation' | 'completion' | 'excellence';
    mentorId?: string;
    statement?: string;
    cohort?: string;
    menteeId?: string;
}

export interface AchievementItem {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    status: 'locked' | 'in_progress' | 'unlocked';
    earnedAt?: string | null;
    color?: string;
    progress?: {
        current: number;
        target: number;
        unit?: string;
    };
    rewardPoints?: number;
}

export type CertificateScope = 'mentee' | 'mentor' | 'admin';

export const fetchCertificates = async (scope?: CertificateScope): Promise<CertificateSummary[]> => {
    const params = scope ? { scope } : undefined;
    const { data } = await apiClient.get('/certificates', { params, timeout: CERTIFICATE_TIMEOUT });
    return data?.certificates || [];
};

export const fetchAchievements = async (): Promise<AchievementItem[]> => {
    const { data } = await apiClient.get('/achievements', { timeout: CERTIFICATE_TIMEOUT });
    return data?.achievements || [];
};

export const downloadCertificate = async (certificateId: string): Promise<void> => {
    const response = await apiClient.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob',
        timeout: CERTIFICATE_DOWNLOAD_TIMEOUT,
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const disposition = response.headers['content-disposition'] as string | undefined;
    const filenameMatch = disposition && /filename="?([^";]+)"?/i.exec(disposition);
    anchor.href = url;
    anchor.download = filenameMatch?.[1] || 'certificate.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
};

export const requestCertificateIssue = async (payload: IssueCertificatePayload) => {
    const { data } = await apiClient.post('/certificates/issue', payload, { timeout: CERTIFICATE_TIMEOUT });
    return data?.certificate;
};

export const requestCertificateReissue = async (certificateId: string, reason?: string) => {
    const { data } = await apiClient.post(`/certificates/${certificateId}/reissue-request`, { reason }, { timeout: CERTIFICATE_TIMEOUT });
    return data;
};
