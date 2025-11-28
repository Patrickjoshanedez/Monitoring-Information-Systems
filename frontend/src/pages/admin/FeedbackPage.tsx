import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AdminFeedbackDashboard from '../../components/admin/AdminFeedbackDashboard';

const FeedbackPage: React.FC = () => {
    return (
        <DashboardLayout>
            <div className="tw-p-6">
                <AdminFeedbackDashboard />
            </div>
        </DashboardLayout>
    );
};

export default FeedbackPage;
