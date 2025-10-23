import React from 'react';
import Header from '../shared/Header';
import Footer from '../shared/Footer';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tw-min-h-screen tw-flex tw-flex-col">
    {/* Header with purple bg */}
    <Header />
    <main className="tw-flex-1 tw-bg-gray-50 tw-pt-0">
      {children}
    </main>
    <Footer />
  </div>
);

export default DashboardLayout;
