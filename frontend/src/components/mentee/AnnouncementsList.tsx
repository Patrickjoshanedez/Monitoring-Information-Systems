import React, { useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  isFeatured: boolean;
}

const AnnouncementCard: React.FC<{ announcement: Announcement }> = ({ announcement }) => {
  return (
    <div className="tw-border-b tw-border-gray-200 tw-pb-6 tw-mb-6 last:tw-border-b-0 last:tw-mb-0">
      {/* Featured Badge */}
      {announcement.isFeatured && (
        <div className="tw-flex tw-items-center tw-mb-2">
          <span className="tw-text-yellow-500 tw-mr-2">⭐</span>
          <span className="tw-text-sm tw-font-bold tw-text-gray-700">Featured Announcement</span>
        </div>
      )}

      {/* Title */}
      <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">
        {announcement.title}
      </h3>

      {/* Date and Category */}
      <div className="tw-flex tw-items-center tw-text-sm tw-text-gray-600 tw-mb-3">
        <span className="tw-text-gray-400 tw-mr-2">📅</span>
        <span>{announcement.date}</span>
        <span className="tw-mx-2">|</span>
        <span className="tw-text-red-500 tw-mr-1">🚀</span>
        <span>Category: {announcement.category}</span>
      </div>

      {/* Description */}
      <p className="tw-text-gray-700 tw-mb-4 tw-leading-relaxed">
        {announcement.description}
      </p>

      {/* View Details Link */}
      <div className="tw-flex tw-items-center">
        <span className="tw-text-yellow-500 tw-mr-2">👉</span>
        <button className="tw-text-gray-700 hover:tw-text-primary tw-text-sm tw-font-medium">
          [View Details]
        </button>
      </div>
    </div>
  );
};

const AnnouncementsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const announcements: Announcement[] = [
    {
      id: '1',
      title: 'Mentoring Orientation 2025 — Don\'t Miss It!',
      date: 'October 10, 2025',
      category: 'Events',
      description: 'The official mentoring orientation for all new mentees and mentors will be held at the University Auditorium. Get to know your mentors, learn program guidelines, and join fun activities!',
      isFeatured: true
    },
    {
      id: '2',
      title: 'Mentoring Orientation 2025 — Don\'t Miss It!',
      date: 'October 10, 2025',
      category: 'Events',
      description: 'The official mentoring orientation for all new mentees and mentors will be held at the University Auditorium. Get to know your mentors, learn program guidelines, and join fun activities!',
      isFeatured: true
    },
    {
      id: '3',
      title: 'Mentoring Orientation 2025 — Don\'t Miss It!',
      date: 'October 10, 2025',
      category: 'Events',
      description: 'The official mentoring orientation for all new mentees and mentors will be held at the University Auditorium. Get to know your mentors, learn program guidelines, and join fun activities!',
      isFeatured: true
    }
  ];

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-8">
      {/* Search Bar */}
      <div className="tw-flex tw-justify-end tw-mb-6">
        <div className="tw-relative">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tw-px-4 tw-py-2 tw-pr-10 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="tw-absolute tw-right-2 tw-top-2 tw-text-gray-400 hover:tw-text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div>
        {filteredAnnouncements.map((announcement) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} />
        ))}
      </div>

      {/* Empty State */}
      {filteredAnnouncements.length === 0 && (
        <div className="tw-text-center tw-py-12">
          <p className="tw-text-gray-500">No announcements found</p>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsList;

