import React from 'react';

const PeopleBehind: React.FC = () => {
  return (
    <section className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6">
      <div className="tw-flex tw-flex-col tw-gap-4">
        <div>
          <p className="tw-text-sm tw-uppercase tw-tracking-wide tw-text-purple-600 tw-font-semibold">People behind this</p>
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Computer Society Organizational Chart</h2>
          <p className="tw-text-sm tw-text-gray-600">
            Meet the dedicated leaders and representatives powering the mentoring initiative.
          </p>
        </div>
        <div className="tw-rounded-2xl tw-overflow-hidden tw-border tw-border-gray-200 tw-bg-gray-50">
          <img
            src="/people-behind-chart.png"
            alt="Computer Society organizational chart showing mentors and officers supporting the mentoring program"
            className="tw-w-full tw-h-auto"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default PeopleBehind;

