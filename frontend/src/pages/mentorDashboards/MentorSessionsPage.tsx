import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MentorSessionsManager from '../../components/mentor/MentorSessionsManager';
import MentorRecognitionPanel from '../../components/mentor/MentorRecognitionPanel';

const MentorSessionsPage: React.FC = () => (
    <DashboardLayout>
        <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-6">
            <div className="tw-bg-gradient-to-r tw-from-primary tw-to-purple-500 tw-rounded-2xl tw-p-6 tw-text-white tw-shadow-xl">
                <p className="tw-text-sm tw-uppercase tw-tracking-wide tw-font-semibold tw-text-white/80">Mentor workspace</p>
                <h1 className="tw-text-3xl tw-font-bold tw-mt-1">Session management</h1>
                <p className="tw-mt-2 tw-text-sm tw-text-white/80">
                    Review upcoming meetings, capture outcomes, and instantly open feedback for your mentees with one click.
                </p>
            </div>

            <MentorRecognitionPanel />

            <MentorSessionsManager />
        </div>
    </DashboardLayout>
);

export default MentorSessionsPage;
