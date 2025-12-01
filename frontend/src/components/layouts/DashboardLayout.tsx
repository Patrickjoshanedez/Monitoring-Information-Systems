import React from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '../shared/Header';
import Footer from '../shared/Footer';

const ROUTE_VARIANTS = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isFetching = useIsFetching();
  const location = useLocation();

  return (
    <div className="tw-min-h-screen tw-flex tw-flex-col tw-bg-white">
      <Header />
      <div className="tw-relative tw-flex-1 tw-bg-gray-50 tw-overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="tw-absolute tw-top-0 tw-left-0 tw-h-[3px] tw-w-full tw-bg-gradient-to-r tw-from-blue-500 tw-via-indigo-500 tw-to-purple-500 tw-z-20"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: isFetching ? 1 : 0, scaleX: isFetching ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformOrigin: '0% 50%' }}
        />
        <AnimatePresence mode="sync" initial={false}>
          <motion.main
            key={location.pathname}
            className="tw-relative tw-flex-1 tw-pt-0 tw-z-10 tw-min-h-full tw-w-full tw-bg-gray-50"
            variants={ROUTE_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ willChange: 'opacity, transform' }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
