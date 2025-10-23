import React from 'react';

interface KPIProps {
  value: number | string;
  label: string;
  percentage: number;
}

const SessionKPIs: React.FC = () => {
  const CircularProgress: React.FC<KPIProps> = ({ value, label, percentage }) => {
    const size = 120;
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="tw-text-center">
        <div className="tw-relative tw-inline-flex tw-items-center tw-justify-center">
          <svg className="tw-transform -tw-rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#8B5CF6"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="tw-absolute tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-gray-900">{value}</div>
          </div>
        </div>
        <p className="tw-mt-2 tw-text-sm tw-text-gray-600">{label}</p>
      </div>
    );
  };

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-8 tw-mb-8">
      <CircularProgress value={6} label="Joined Sessions" percentage={66} />
      <CircularProgress value="93.46%" label="Ratings" percentage={93} />
      <CircularProgress value={3} label="Successful" percentage={33} />
    </div>
  );
};

export default SessionKPIs;

