import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AdminCertificatePanel from '../../components/admin/AdminCertificatePanel';

const AdminRecognitionPage: React.FC = () => {
    return (
        <DashboardLayout>
            <div className="tw-p-6 tw-space-y-6">
                <header className="tw-space-y-1">
                    <p className="tw-text-xs tw-font-semibold tw-text-purple-600 tw-uppercase">Recognition</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Certificates & Issuance</h1>
                    <p className="tw-text-sm tw-text-gray-600">
                        Generate certificates, review recent issuances, and download PDFs from a single admin workspace.
                    </p>
                </header>

                <AdminCertificatePanel />
            </div>
        </DashboardLayout>
    );
};

export default AdminRecognitionPage;
