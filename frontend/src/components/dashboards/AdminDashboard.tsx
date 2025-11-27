import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ApplicationReviewPanel from '../admin/ApplicationReviewPanel';
import MentorCapacityOverridesPanel from '../admin/MentorCapacityOverridesPanel';

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

        <section className="tw-bg-gradient-to-r tw-from-purple-600 tw-to-indigo-600 tw-rounded-3xl tw-p-6 tw-text-white tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-4 tw-shadow-lg">
          <div>
            <p className="tw-text-sm tw-uppercase tw-tracking-wide tw-text-white/80">New</p>
            <h2 className="tw-text-2xl tw-font-semibold">Matching workspace</h2>
            <p className="tw-text-white/90 tw-mt-1">
              Monitor every pairing, adjust mentor/mentee assignments, and keep an auditable trail of changes in one place.
            </p>
          </div>
          <Link
            to="/admin/matching"
            className="tw-inline-flex tw-justify-center tw-rounded-full tw-bg-white tw-px-5 tw-py-2 tw-text-sm tw-font-semibold tw-text-purple-700 hover:tw-text-purple-900"
          >
            Open matching
          </Link>
        </section>

        <section id="applications" className="tw-scroll-mt-24">
          <ApplicationReviewPanel />
        </section>

        <section id="capacity" className="tw-scroll-mt-24">
          <MentorCapacityOverridesPanel />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
