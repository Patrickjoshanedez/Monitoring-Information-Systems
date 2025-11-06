import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import WelcomeBanner from '../mentee/WelcomeBanner';
import IconTileRow from '../mentee/IconTileRow';
import StatsPanel from '../mentee/StatsPanel';
import MentorDirectorySection from '../mentee/MentorDirectorySection';
import MenteeRequestsTable from '../mentee/MenteeRequestsTable';
import PeopleBehind from '../mentee/PeopleBehind';

const MenteeDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Welcome Banner */}
        <WelcomeBanner />

        {/* Icon Tiles */}
        <IconTileRow />

        {/* Stats Panel */}
        <StatsPanel />

        {/* Mentor Directory */}
        <MentorDirectorySection />

        {/* My Requests */}
        <div className="tw-mt-8">
          <MenteeRequestsTable />
        </div>

        {/* People Behind This */}
        <PeopleBehind />
      </div>
    </DashboardLayout>
  );
};

export default MenteeDashboard;
