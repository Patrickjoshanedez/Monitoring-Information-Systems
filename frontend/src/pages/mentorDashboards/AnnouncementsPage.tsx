import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AnnouncementsList from '../../components/mentee/AnnouncementsList';

const MentorAnnouncementsPage: React.FC = () => {
    return (
        <DashboardLayout>
            <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
                <div className="tw-mb-8">
                    <p className="tw-text-sm tw-uppercase tw-font-semibold tw-text-indigo-500">Mentor hub</p>
                    <h1 className="tw-text-4xl tw-font-bold tw-text-gray-900 tw-mb-2">Program announcements</h1>
                    <p className="tw-text-gray-700 tw-text-lg">
                        Stay informed about session updates, mentee milestones, and system notices curated for mentors.
                    </p>
                </div>
                <AnnouncementsList />
            </div>
        </DashboardLayout>
    );
};

export default MentorAnnouncementsPage;
