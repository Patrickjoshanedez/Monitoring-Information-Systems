import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import SessionKPIs from '../../components/mentee/SessionKPIs';
import UpcomingSessionsTable from '../../components/mentee/UpcomingSessionsTable';
import SessionHistoryTable from '../../components/mentee/SessionHistoryTable';

const SessionPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* KPIs Section */}
        <SessionKPIs />

        {/* Upcoming Sessions */}
        <UpcomingSessionsTable />

        {/* Session History */}
        <SessionHistoryTable />
      </div>
    </DashboardLayout>
  );
};

export default SessionPage;

