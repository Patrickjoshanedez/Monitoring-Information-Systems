import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpcomingSessionsTable from '../../components/mentee/UpcomingSessionsTable';
import SessionHistoryTable from '../../components/mentee/SessionHistoryTable';
import PendingFeedbackList from '../../components/mentee/PendingFeedbackList';
import SessionActionsPanel from '../../components/mentee/SessionActionsPanel';
import RecognitionPanel from '../../components/mentee/RecognitionPanel';

const SessionPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Quick actions */}
        <SessionActionsPanel />

        {/* Certificates & achievements */}
        <RecognitionPanel />

        {/* Upcoming Sessions */}
        <UpcomingSessionsTable />

        {/* Pending feedback */}
        <PendingFeedbackList />

        {/* Session History */}
        <SessionHistoryTable />
      </div>
    </DashboardLayout>
  );
};

export default SessionPage;

