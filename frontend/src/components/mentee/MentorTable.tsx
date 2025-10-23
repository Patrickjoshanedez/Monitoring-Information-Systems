import React, { useState } from 'react';

interface Mentor {
  id: string;
  name: string;
  institutionalId: string;
  subject: string;
  schedule: string;
  status: 'In Progress' | 'Completed';
}

interface MentorTableProps {
  mentors: Mentor[];
  title: string;
  showSearch?: boolean;
  showSort?: boolean;
}

const MentorTable: React.FC<MentorTableProps> = ({ mentors, title, showSearch = true, showSort = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMentors = [...filteredMentors].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'subject':
        return a.subject.localeCompare(b.subject);
      case 'schedule':
        return a.schedule.localeCompare(b.schedule);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-8">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">{title}</h2>
        <div className="tw-flex tw-items-center tw-space-x-4">
          {showSearch && (
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
          )}
          {showSort && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            >
              <option value="name">Sort by Name</option>
              <option value="subject">Sort by Subject</option>
              <option value="schedule">Sort by Schedule</option>
              <option value="status">Sort by Status</option>
            </select>
          )}
        </div>
      </div>

      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
          <thead className="tw-bg-gray-50">
            <tr>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Name
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Institutional ID
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Subject
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Schedule
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {sortedMentors.map((mentor) => (
              <tr key={mentor.id} className="hover:tw-bg-gray-50">
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-gray-900">
                  {mentor.name}
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-blue-600 hover:tw-text-blue-800">
                  <a href={`mailto:${mentor.institutionalId}`}>
                    {mentor.institutionalId}
                  </a>
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">
                  {mentor.subject}
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">
                  {mentor.schedule}
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <span
                    className={`tw-inline-flex tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-full ${
                      mentor.status === 'In Progress'
                        ? 'tw-bg-green-100 tw-text-green-800'
                        : 'tw-bg-gray-100 tw-text-gray-800'
                    }`}
                  >
                    {mentor.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedMentors.length === 0 && (
        <div className="tw-text-center tw-py-8">
          <p className="tw-text-gray-500">No mentors found</p>
        </div>
      )}
    </div>
  );
};

export default MentorTable;

