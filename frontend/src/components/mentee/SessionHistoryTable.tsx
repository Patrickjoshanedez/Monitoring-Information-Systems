import React, { useState } from 'react';

interface SessionHistory {
  id: string;
  subject: string;
  mentor: string;
  dateCompleted: string;
  status: string;
  feedback: string;
}

const SessionHistoryTable: React.FC = () => {
  const [sortBy, setSortBy] = useState('dateCompleted');
  const [sessions] = useState<SessionHistory[]>([
    { id: '1', subject: 'Computer Prog', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Computer Programming', status: 'Upcoming', feedback: 'View details' },
    { id: '2', subject: 'Computer Prog', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Database', status: 'Deleted', feedback: 'View details' },
    { id: '3', subject: 'Web Dev', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Networking', status: 'Reschedule', feedback: 'View details' },
    { id: '4', subject: 'Taylor Swift', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Computer Programming', status: '', feedback: 'Wed 10:00am-12:00pm' },
    { id: '5', subject: 'Justin Beiber', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Database', status: '', feedback: 'Wed 10:00am-12:00pm' },
    { id: '6', subject: 'james Reid', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Networking', status: '', feedback: 'Wed 10:00am-12:00pm' },
    { id: '7', subject: 'Taylor Swift', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Computer Programming', status: '', feedback: 'Wed 10:00am-12:00pm' },
    { id: '8', subject: 'Justin Beiber', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Database', status: '', feedback: 'Wed 10:00am-12:00pm' },
    { id: '9', subject: 'james Reid', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Networking', status: '', feedback: 'Wed 10:00am-12:00pm' },
    { id: '10', subject: 'Taylor Swift', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Computer Programming', status: '', feedback: 'Wed 10:00am-12:00pm' },
    { id: '11', subject: 'Justin Beiber', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Database', status: '', feedback: 'Wed 10:00am-12:00pm' },
    { id: '12', subject: 'james Reid', mentor: '2301104775@student.buksu.edu.ph', dateCompleted: 'Networking', status: '', feedback: 'Wed 10:00am-12:00pm' }
  ]);

  const sortedSessions = [...sessions].sort((a, b) => {
    switch (sortBy) {
      case 'subject':
        return a.subject.localeCompare(b.subject);
      case 'mentor':
        return a.mentor.localeCompare(b.mentor);
      case 'dateCompleted':
        return a.dateCompleted.localeCompare(b.dateCompleted);
      default:
        return 0;
    }
  });

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Session History</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
        >
          <option value="subject">Sort by Subject</option>
          <option value="mentor">Sort by Mentor</option>
          <option value="dateCompleted">Sort by Date</option>
        </select>
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
                Date completed
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Status
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Feedback
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
                  {session.dateCompleted}
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  {session.status && (
                    <span className="tw-inline-flex tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-full tw-bg-gray-100 tw-text-gray-800">
                      {session.status}
                    </span>
                  )}
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  {session.feedback === 'View details' ? (
                    <button className="tw-text-primary hover:tw-text-purple-700 tw-text-sm tw-font-medium">
                      {session.feedback}
                    </button>
                  ) : (
                    <span className="tw-text-sm tw-text-gray-600">{session.feedback}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionHistoryTable;

