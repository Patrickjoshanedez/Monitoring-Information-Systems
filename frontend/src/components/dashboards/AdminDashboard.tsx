import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import ApplicationReviewPanel from '../admin/ApplicationReviewPanel';

const AdminDashboard = () => {
  return (
    <DashboardLayout>
      <div className="tw-p-6 tw-space-y-6">
        <div>
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Admin Dashboard</h1>
          <p className="tw-text-gray-600 tw-mt-2">Manage applications and system settings</p>
        </div>
        
        {/* Application Review Panel */}
        <ApplicationReviewPanel />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
