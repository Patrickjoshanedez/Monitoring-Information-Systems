import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MentorRecognitionPanel from '../../components/mentor/MentorRecognitionPanel';

const MentorRecognitionPage: React.FC = () => {
    return (
        <DashboardLayout>
            <div className="tw-max-w-6xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-6">
                <header>
                    <p className="tw-text-xs tw-font-semibold tw-text-primary tw-uppercase">Recognition</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Verify & sign mentee certificates</h1>
                    <p className="tw-text-sm tw-text-gray-600">
                        Reference every certificate you've issued, review pending signature requests, and deliver verified download links
                        to your mentees in one centralized workspace.
                    </p>
                </header>
                <MentorRecognitionPanel />
            </div>
        </DashboardLayout>
    );
};

export default MentorRecognitionPage;
