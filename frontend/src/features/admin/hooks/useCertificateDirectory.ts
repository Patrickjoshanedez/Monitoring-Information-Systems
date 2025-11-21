import { useQuery } from '@tanstack/react-query';
import { AdminDirectoryUser, DirectoryRole, fetchApprovedDirectory } from '../services/certificateAdminApi';

const directoryKey = (role: DirectoryRole) => ['admin', 'certificate-directory', role] as const;

const useApprovedDirectory = (role: DirectoryRole) => {
    return useQuery<AdminDirectoryUser[]>({
        queryKey: directoryKey(role),
        queryFn: () => fetchApprovedDirectory(role),
        staleTime: 5 * 60 * 1000,
    });
};

export const useApprovedMentees = () => useApprovedDirectory('mentee');
export const useApprovedMentors = () => useApprovedDirectory('mentor');
