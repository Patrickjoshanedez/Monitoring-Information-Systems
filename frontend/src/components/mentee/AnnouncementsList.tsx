import React, { useMemo, useState } from 'react';
import useAnnouncements from '../../shared/hooks/useAnnouncements';
import { AnnouncementDto } from '../../shared/services/announcementsService';

const formatPublishedDate = (isoDate: string): string => {
    if (!isoDate) {
        return '—';
    }

  try {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(new Date(isoDate));
  } catch {
        return isoDate;
    }
};

const AnnouncementCard: React.FC<{ announcement: AnnouncementDto }> = ({ announcement }) => {
  return (
    <article className="tw-border-b tw-border-gray-200 tw-pb-6 tw-mb-6 last:tw-border-b-0 last:tw-mb-0" aria-labelledby={`announcement-${announcement.id}`}>
      {announcement.isFeatured && (
        <div className="tw-flex tw-items-center tw-mb-2" aria-label="Featured announcement">
          <span className="tw-text-yellow-500 tw-mr-2" aria-hidden="true">⭐</span>
          <span className="tw-text-sm tw-font-bold tw-text-gray-700">Featured Announcement</span>
        </div>
      )}

      <h3 id={`announcement-${announcement.id}`} className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">
        {announcement.title}
      </h3>

      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600 tw-mb-3">
        <div className="tw-flex tw-items-center">
          <span className="tw-text-gray-400 tw-mr-2" aria-hidden="true">📅</span>
          <span>{formatPublishedDate(announcement.publishedAt)}</span>
        </div>
        <span className="tw-hidden sm:tw-inline">|</span>
        <div className="tw-flex tw-items-center">
          <span className="tw-text-red-500 tw-mr-1" aria-hidden="true">🚀</span>
          <span>{announcement.category}</span>
        </div>
      </div>

      <p className="tw-text-gray-700 tw-mb-4 tw-leading-relaxed">
        {announcement.summary || announcement.body}
      </p>

      <div className="tw-flex tw-items-center">
        <span className="tw-text-yellow-500 tw-mr-2" aria-hidden="true">👉</span>
        <button
          type="button"
          className="tw-text-gray-700 hover:tw-text-primary tw-text-sm tw-font-medium tw-transition-colors"
          aria-label={`View details for ${announcement.title}`}
        >
          View details
        </button>
      </div>
    </article>
  );
};

const AnnouncementsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { announcements, isLoading, isError, refetch } = useAnnouncements();

  const filteredAnnouncements = useMemo(() => (
    announcements.filter((announcement) => {
      const query = searchTerm.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        announcement.title.toLowerCase().includes(query) ||
        announcement.category.toLowerCase().includes(query) ||
        (announcement.summary || announcement.body).toLowerCase().includes(query)
      );
    })
  ), [announcements, searchTerm]);

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-8">
      <div className="tw-flex tw-justify-end tw-mb-6">
        <div className="tw-relative">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tw-px-4 tw-py-2 tw-pr-10 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
            aria-label="Search announcements"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="tw-absolute tw-right-2 tw-top-2 tw-text-gray-400 hover:tw-text-gray-600"
              aria-label="Clear announcement search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="tw-flex tw-justify-center tw-items-center tw-py-12" role="status" aria-live="polite">
          <div className="tw-animate-spin tw-rounded-full tw-h-10 tw-w-10 tw-border-4 tw-border-gray-200 tw-border-t-primary" />
          <span className="tw-ml-3 tw-text-gray-600">Loading announcements…</span>
        </div>
      )}

      {isError && !isLoading && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4" role="alert">
          <p className="tw-text-red-700 tw-mb-3">We couldn’t load announcements right now.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="tw-text-sm tw-font-medium tw-text-red-700 hover:tw-text-red-900"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div>
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}

      {!isLoading && !isError && filteredAnnouncements.length === 0 && (
        <div className="tw-text-center tw-py-12" role="status" aria-live="polite">
          <p className="tw-text-gray-500">No announcements match your search.</p>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsList;

