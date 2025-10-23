import React from 'react';

const WelcomeBanner: React.FC = () => {
  return (
    <div className="tw-bg-primary tw-rounded-lg tw-p-8 tw-mb-8 tw-text-white">
      <h1 className="tw-text-3xl tw-font-bold tw-mb-4">Welcome back, Kathryn!</h1>
      <div className="tw-relative">
        <input
          type="text"
          placeholder="Search mentors, sessions, or resources..."
          className="tw-w-full tw-px-4 tw-py-3 tw-pl-12 tw-pr-12 tw-rounded-lg tw-text-gray-900 tw-bg-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-300"
        />
        <button className="tw-absolute tw-right-3 tw-top-3 tw-text-gray-400 hover:tw-text-gray-600">
          ✕
        </button>
      </div>
    </div>
  );
};

export default WelcomeBanner;

