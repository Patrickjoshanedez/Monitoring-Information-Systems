import React from 'react';
import Header from '../shared/Header';
import Footer from '../shared/Footer';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tw-min-h-screen tw-flex tw-flex-col tw-bg-white dark:tw-bg-slate-950 dark:tw-text-slate-100">
    {/* Header with purple bg */}
    <Header />
    <main className="tw-flex-1 tw-bg-gray-50 tw-pt-0 dark:tw-bg-slate-950">
      {children}
    </main>
    <Footer />
  </div>
);

export default DashboardLayout;
