import React from 'react';

const StatsPanel: React.FC = () => {
  const stats = [
    { label: 'Total Number of People in Session', value: 45, suffix: '' },
    { label: 'Total Percentage of Ratings', value: 92, suffix: '%' },
    { label: 'Total number of successful mentoring', value: 128, suffix: '' }
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

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-text-center"
        >
          <div className="tw-flex tw-items-center tw-justify-center tw-mb-4">
            <CircularProgress value={stat.value} />
          </div>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-2">{stat.label}</p>
          <p className="tw-text-3xl tw-font-bold tw-text-primary">
            {stat.value}{stat.suffix}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;

