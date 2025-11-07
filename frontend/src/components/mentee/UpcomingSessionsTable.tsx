import React, { useMemo, useState } from 'react';
import { useMenteeInsights } from '../../features/mentorship/hooks/useMenteeInsights';

type Row = {
  id: string;
  subject: string;
  mentor: string;
  suggestion: string | null;
  createdAt: string;
};

const UpcomingSessionsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'subject' | 'mentor' | 'date' | 'created'>('date');
  const { insights, isLoading } = useMenteeInsights();

  const rows = useMemo<Row[]>(() => {
    return insights.upcomingSessions.map((s) => ({
      id: s.id,
      subject: s.subject,
      mentor: s.mentorName,
      suggestion: s.sessionSuggestion,
      createdAt: s.createdAt,
    }));
  }, [insights.upcomingSessions]);

  const filtered = rows.filter((r) =>
    r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mentor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toTime = (val?: string | null) => (val ? Date.parse(val) : 0);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'subject':
        return a.subject.localeCompare(b.subject);
      case 'mentor':
        return a.mentor.localeCompare(b.mentor);
      case 'created':
        return toTime(b.createdAt) - toTime(a.createdAt);
      case 'date':
      default:
        return toTime(b.suggestion) - toTime(a.suggestion);
    }
  });

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-8">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Upcoming Sessions</h2>
        <div className="tw-flex tw-items-center tw-space-x-4">
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            title="Sort sessions by"
            aria-label="Sort sessions by"
          >
            <option value="subject">Sort by Subject</option>
            <option value="mentor">Sort by Mentor</option>
            <option value="date">Sort by Session Date</option>
            <option value="created">Sort by Requested</option>
          </select>
        </div>
      </div>

      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
          <thead className="tw-bg-gray-50">
            <tr>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Subject
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Mentor
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Suggested Date/Time
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Requested
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {(isLoading ? [] : sorted).map((r) => (
              <tr key={r.id} className="hover:tw-bg-gray-50">
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-gray-900">{r.subject}</td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">{r.mentor}</td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">{r.suggestion || '—'}</td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {(!isLoading && sorted.length === 0) && (
              <tr>
                <td className="tw-px-6 tw-py-6 tw-text-sm tw-text-gray-500" colSpan={4}>No upcoming sessions. When a mentor accepts and suggests a time, it will appear here.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingSessionsTable;

