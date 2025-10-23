import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import CategoryCards from '../components/mentee/CategoryCards';
import MentorCards from '../components/mentee/MentorCards';
import ApplicationForm from '../components/mentee/ApplicationForm';

const ApplyPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Title */}
        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mb-8">Apply to a new mentor!</h1>

        {/* Category Cards */}
        <CategoryCards />

        {/* Mentor Cards */}
        <MentorCards />

        {/* Application Form */}
        <ApplicationForm />
      </div>
    </DashboardLayout>
  );
};

export default ApplyPage;

