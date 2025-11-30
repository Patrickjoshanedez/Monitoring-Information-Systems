import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpcomingSessionsTable from '../../components/mentee/UpcomingSessionsTable';
import SessionHistoryTable from '../../components/mentee/SessionHistoryTable';
import PendingFeedbackList from '../../components/mentee/PendingFeedbackList';
import SessionActionsPanel from '../../components/mentee/SessionActionsPanel';
import RecognitionPanel from '../../components/mentee/RecognitionPanel';
import ProgressDashboard from '../../components/mentee/ProgressDashboard';

const SessionPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Quick actions */}
        <SessionActionsPanel />

        <div className="tw-mt-6 lg:tw-grid lg:tw-grid-cols-[1.618fr_1fr] lg:tw-gap-6 tw-items-start">
          <div className="tw-space-y-6">
            {/* Upcoming Sessions */}
            <UpcomingSessionsTable />

            {/* Pending feedback */}
            <PendingFeedbackList />

            {/* Session History */}
            <SessionHistoryTable />
          </div>

          <aside className="tw-mt-6 lg:tw-mt-0 tw-space-y-6">
            {/* Progress snapshot (mentor feedback + goals) */}
            <ProgressDashboard />

            {/* Certificates & achievements */}
            <RecognitionPanel />
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SessionPage;

