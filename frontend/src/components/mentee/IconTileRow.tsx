import React from 'react';

const IconTileRow: React.FC = () => {
  const tiles = [
    { icon: '📅', label: 'Current Session', description: 'View active sessions' },
    { icon: '👥', label: 'My Mentors', description: 'See your mentors' },
    { icon: '📋', label: 'Schedule', description: 'Manage schedule' }
  ];

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-8">
      {tiles.map((tile, index) => (
        <div
          key={index}
          className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-text-center hover:tw-shadow-lg tw-transition-shadow"
        >
          <div className="tw-text-5xl tw-mb-4">{tile.icon}</div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-2">{tile.label}</h3>
          <p className="tw-text-sm tw-text-gray-600">{tile.description}</p>
        </div>
      ))}
    </div>
  );
};

export default IconTileRow;

