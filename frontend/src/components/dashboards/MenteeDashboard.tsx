import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import WelcomeBanner from '../mentee/WelcomeBanner';
import PeopleBehind from '../mentee/PeopleBehind';
import MatchNotificationBanner from '../mentee/MatchNotificationBanner';

const MenteeDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Welcome Banner */}
        <WelcomeBanner />

  {/* Mentor Match Notification */}
  <MatchNotificationBanner />

        {/* People Behind This */}
        <PeopleBehind />
      </div>
    </DashboardLayout>
  );
};

export default MenteeDashboard;
