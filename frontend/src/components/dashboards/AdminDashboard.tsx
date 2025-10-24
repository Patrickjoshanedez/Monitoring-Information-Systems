import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import ApplicationReviewPanel from '../admin/ApplicationReviewPanel';

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-p-6 tw-space-y-6">
        <header className="tw-flex tw-flex-col tw-gap-2">
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Admin Dashboard</h1>
          <p className="tw-text-gray-600 tw-leading-6">
            Review mentor and mentee applications and oversee platform management tasks.
          </p>
        </header>

        <section id="applications" className="tw-scroll-mt-24">
          <ApplicationReviewPanel />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
