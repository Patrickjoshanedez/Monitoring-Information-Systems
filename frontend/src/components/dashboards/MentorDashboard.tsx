import React from 'react';
import OverviewMetrics from '../mentor/OverviewMetrics';
import MentorRequestsTable from '../mentor/MentorRequestsTable';

const MentorDashboard: React.FC = () => {
  return (
    <div className="tw-p-6 tw-space-y-6">
      <h1 className="tw-text-2xl tw-font-semibold tw-text-gray-900">Mentor Dashboard</h1>
      <OverviewMetrics />
      <MentorRequestsTable />
    </div>
  );
};

export default MentorDashboard;
