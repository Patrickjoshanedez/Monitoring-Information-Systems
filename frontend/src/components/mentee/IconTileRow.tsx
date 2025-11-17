import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMenteeInsights } from '../../features/mentorship/hooks/useMenteeInsights';

const IconTileRow: React.FC = () => {
  const { insights, isLoading } = useMenteeInsights();

  const tiles = useMemo(
    () => [
      { icon: '📅', label: 'Current Sessions', description: isLoading ? 'Loading…' : `${insights.upcomingSessions.length} upcoming` },
      { icon: '👥', label: 'My Mentors', description: isLoading ? 'Loading…' : `${insights.uniqueMentorsAccepted} connected` },
      { icon: '📋', label: 'Requests', description: isLoading ? 'Loading…' : `${insights.pendingRequests} pending · ${insights.acceptedRequests} accepted` },
      { icon: '🤝', label: 'Matches', description: 'Review suggested mentors', to: '/mentee/matches' },
    ],
    [insights, isLoading]
  );

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
      {tiles.map((tile, index) => (
        <div key={index}>
          {tile.to ? (
            <Link
              to={tile.to}
              className="tw-block tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-text-center hover:tw-shadow-lg tw-transition-shadow focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <div className="tw-text-5xl tw-mb-4">{tile.icon}</div>
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-2">{tile.label}</h3>
              <p className="tw-text-sm tw-text-gray-600">{tile.description}</p>
            </Link>
          ) : (
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-text-center hover:tw-shadow-lg tw-transition-shadow">
              <div className="tw-text-5xl tw-mb-4">{tile.icon}</div>
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-2">{tile.label}</h3>
              <p className="tw-text-sm tw-text-gray-600">{tile.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default IconTileRow;

