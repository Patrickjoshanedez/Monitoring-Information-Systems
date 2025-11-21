import { apiClient } from '../../../shared/config/apiClient';

export type DirectoryRole = 'mentee' | 'mentor';

export interface AdminDirectoryUser {
    id: string;
    name: string;
    email: string;
    focus?: string;
    studentId?: string;
    metadata?: string;
}

interface AdminApplicationRecord {
    _id: string;
    firstname?: string;
    lastname?: string;
    email: string;
    role?: string;
    applicationRole?: string;
    applicationStatus?: string;
    applicationData?: Record<string, any>;
    studentId?: string;
}

interface AdminApplicationsResponse {
    success: boolean;
    applications: AdminApplicationRecord[];
}

const formatName = (applicant: AdminApplicationRecord) => {
    const first = applicant.firstname?.trim() || '';
    const last = applicant.lastname?.trim() || '';
    const combined = `${first} ${last}`.trim();
    return combined || applicant.email;
};

const buildFocusLabel = (record: AdminApplicationRecord, role: DirectoryRole) => {
    if (role === 'mentor') {
        const areas = record.applicationData?.expertiseAreas;
        if (Array.isArray(areas) && areas.length) {
            return areas.slice(0, 3).join(', ');
        }
        if (record.applicationData?.currentRole) {
            return record.applicationData.currentRole;
        }
        return 'Mentor';
    }

    if (record.applicationData?.major) {
        return record.applicationData.major;
    }
    if (record.applicationData?.program) {
        return record.applicationData.program;
    }
    return 'Mentee';
};

export const fetchApprovedDirectory = async (role: DirectoryRole): Promise<AdminDirectoryUser[]> => {
    const params = { status: 'approved', role, limit: 100 };
    const { data } = await apiClient.get<AdminApplicationsResponse>('/admin/applications', { params });
    if (!data?.applications) {
        return [];
    }

    return data.applications.map((record) => ({
        id: record._id,
        name: formatName(record),
        email: record.email,
        focus: buildFocusLabel(record, role),
        studentId: record.studentId || record.applicationData?.studentId,
        metadata: role === 'mentor' ? record.applicationData?.linkedinUrl || record.applicationData?.organization : record.applicationData?.program,
    }));
};
