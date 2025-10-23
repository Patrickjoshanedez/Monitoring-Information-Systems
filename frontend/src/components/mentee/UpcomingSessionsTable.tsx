import React, { useState } from 'react';

interface UpcomingSession {
  id: string;
  subject: string;
  mentor: string;
  dateTime: string;
  decision: 'Accepted' | 'Delete' | 'Cancel';
  status: 'Upcoming' | 'Deleted' | 'Reschedule';
}

const UpcomingSessionsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateTime');
  const [sessions, setSessions] = useState<UpcomingSession[]>([
    {
      id: '1',
      subject: 'Networking',
      mentor: 'James Reid',
      dateTime: '10/8/2025 | 3:00-5:00',
      decision: 'Accepted',
      status: 'Upcoming'
    },
    {
      id: '2',
      subject: 'Computer Pro',
      mentor: 'James Reid',
      dateTime: '10/8/2025 | 3:00-5:00',
      decision: 'Delete',
      status: 'Deleted'
    },
    {
      id: '3',
      subject: 'Database',
      mentor: 'James Reid',
      dateTime: '10/8/2025 | 3:00-5:00',
      decision: 'Cancel',
      status: 'Reschedule'
    }
  ]);

  const filteredSessions = sessions.filter(session =>
    session.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.mentor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'subject':
        return a.subject.localeCompare(b.subject);
      case 'mentor':
        return a.mentor.localeCompare(b.mentor);
      case 'dateTime':
        return a.dateTime.localeCompare(b.dateTime);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const handleDecisionChange = (id: string, newDecision: 'Accepted' | 'Delete' | 'Cancel') => {
    setSessions(sessions.map(session =>
      session.id === id ? { ...session, decision: newDecision } : session
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return 'tw-bg-green-100 tw-text-green-800';
      case 'Deleted':
        return 'tw-bg-red-100 tw-text-red-800';
      case 'Reschedule':
        return 'tw-bg-yellow-100 tw-text-yellow-800';
      default:
        return 'tw-bg-gray-100 tw-text-gray-800';
    }
  };

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
            onChange={(e) => setSortBy(e.target.value)}
            className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
          >
            <option value="subject">Sort by Subject</option>
            <option value="mentor">Sort by Mentor</option>
            <option value="dateTime">Sort by Date</option>
            <option value="status">Sort by Status</option>
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
                Date & Time
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Decision
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {sortedSessions.map((session) => (
              <tr key={session.id} className="hover:tw-bg-gray-50">
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-gray-900">
                  {session.subject}
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">
                  {session.mentor}
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">
                  {session.dateTime}
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <select
                    value={session.decision}
                    onChange={(e) => handleDecisionChange(session.id, e.target.value as 'Accepted' | 'Delete' | 'Cancel')}
                    className="tw-px-3 tw-py-1 tw-border tw-border-gray-300 tw-rounded tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                  >
                    <option value="Accepted">Accepted</option>
                    <option value="Delete">Delete</option>
                    <option value="Cancel">Cancel</option>
                  </select>
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <span className={`tw-inline-flex tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-full ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingSessionsTable;

