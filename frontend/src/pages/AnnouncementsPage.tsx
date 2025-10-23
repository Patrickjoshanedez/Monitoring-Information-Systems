import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import AnnouncementsList from '../components/mentee/AnnouncementsList';

const AnnouncementsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Page Header */}
        <div className="tw-mb-8">
          <h1 className="tw-text-4xl tw-font-bold tw-text-gray-900 tw-italic tw-mb-2">
            Announcement!
          </h1>
          <p className="tw-text-gray-700 tw-text-lg">
            Stay updated with the latest news, events, and mentoring program activities.
          </p>
        </div>

        {/* Announcements List */}
        <AnnouncementsList />
      </div>
    </DashboardLayout>
  );
};

export default AnnouncementsPage;

