import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AdminNotificationCenter from '../../components/admin/AdminNotificationCenter';

const AdminNotificationsPage: React.FC = () => {
    return (
        <DashboardLayout>
            <div className="tw-p-6 tw-space-y-6">
                <header className="tw-space-y-2">
                    <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-indigo-500">Admin</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Notifications</h1>
                    <p className="tw-text-gray-600 tw-max-w-3xl">
                        Broadcast announcements that surface on mentee and mentor pages, or target specific mentees, mentors, and admins
                        with match and session alerts.
                    </p>
                </header>
                <AdminNotificationCenter />
            </div>
        </DashboardLayout>
    );
};

export default AdminNotificationsPage;
