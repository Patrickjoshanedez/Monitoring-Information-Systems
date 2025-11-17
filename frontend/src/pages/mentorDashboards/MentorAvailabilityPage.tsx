import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MentorAvailabilityManager from '../../components/mentor/availability/MentorAvailabilityManager';

const MentorAvailabilityPage: React.FC = () => (
    <DashboardLayout>
        <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
            <MentorAvailabilityManager />
        </div>
    </DashboardLayout>
);

export default MentorAvailabilityPage;
