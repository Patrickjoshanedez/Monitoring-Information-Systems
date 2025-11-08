import React, { Suspense } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import WelcomeBanner from '../mentee/WelcomeBanner';
import IconTileRow from '../mentee/IconTileRow';
import StatsPanel from '../mentee/StatsPanel';
import MentorDirectorySection from '../mentee/MentorDirectorySection';
import MenteeRequestsTable from '../mentee/MenteeRequestsTable';
import PeopleBehind from '../mentee/PeopleBehind';
const MaterialsLibrary = React.lazy(() => import('../mentee/MaterialsLibrary'));
const ProgressDashboard = React.lazy(() => import('../mentee/ProgressDashboard'));

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

        {/* Progress Dashboard */}
        <div className="tw-mt-8">
          <Suspense fallback={<div className="tw-text-sm tw-text-gray-500">Loading progress...</div>}>
            <ProgressDashboard />
          </Suspense>
        </div>

        {/* Materials Library */}
        <div className="tw-mt-8">
          <Suspense fallback={<div className="tw-text-sm tw-text-gray-500">Loading materials...</div>}>
            <MaterialsLibrary />
          </Suspense>
        </div>

        {/* People Behind This */}
        <PeopleBehind />
      </div>
    </DashboardLayout>
  );
};

export default MenteeDashboard;
