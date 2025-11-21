import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import RecognitionPanel from '../../components/mentee/RecognitionPanel';

const RecognitionPage: React.FC = () => {
    return (
        <DashboardLayout>
            <div className="tw-max-w-5xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-6">
                <header>
                    <p className="tw-text-xs tw-font-semibold tw-text-primary tw-uppercase">Recognition</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Certificates & achievements</h1>
                    <p className="tw-text-sm tw-text-gray-600">
                        Generate certificates, download PDFs, request reissues, and track your achievements in one dedicated space.
                    </p>
                </header>
                <RecognitionPanel />
            </div>
        </DashboardLayout>
    );
};

export default RecognitionPage;
