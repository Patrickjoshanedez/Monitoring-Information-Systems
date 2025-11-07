import React from 'react';
import { useMenteeInsights } from '../../features/mentorship/hooks/useMenteeInsights';

const StatsPanel: React.FC = () => {
  const { insights, isLoading } = useMenteeInsights();

  // Define percentage-based KPIs for circular progress
  const stats = [
    { label: 'Match rate (accepted)', value: insights.matchRate, suffix: '%' },
    { label: 'Pending rate', value: insights.pendingRate, suffix: '%' },
    { label: 'Mentor engagement coverage', value: insights.directoryCoverage, suffix: '%' },
  ];

  const CircularProgress: React.FC<{ value: number; size?: number }> = ({ value, size = 100 }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
      <svg className="tw-transform -tw-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#8b5cf6"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-text-center">
            <div className="tw-flex tw-items-center tw-justify-center tw-mb-4">
              <div className="tw-h-[100px] tw-w-[100px] tw-rounded-full tw-bg-gray-100 tw-animate-pulse" />
            </div>
            <div className="tw-h-4 tw-w-2/3 tw-bg-gray-100 tw-rounded tw-mx-auto tw-mb-2" />
            <div className="tw-h-6 tw-w-1/3 tw-bg-gray-100 tw-rounded tw-mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-text-center">
          <div className="tw-flex tw-items-center tw-justify-center tw-mb-3">
            <CircularProgress value={stat.value} />
          </div>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-1">{stat.label}</p>
          <p className="tw-text-2xl tw-font-bold tw-text-primary">{stat.value}{stat.suffix}</p>
        </div>
      ))}

      {/* Inline summary card with raw counts for clarity */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 md:tw-col-span-3">
        <div className="tw-flex tw-flex-wrap tw-gap-6 tw-text-sm tw-text-gray-700">
          <div>
            <span className="tw-font-semibold">Total requests:</span> {insights.totalRequests}
          </div>
          <div>
            <span className="tw-font-semibold">Pending:</span> {insights.pendingRequests}
          </div>
          <div>
            <span className="tw-font-semibold">Accepted:</span> {insights.acceptedRequests}
          </div>
          <div>
            <span className="tw-font-semibold">Unique mentors (accepted):</span> {insights.uniqueMentorsAccepted}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;

