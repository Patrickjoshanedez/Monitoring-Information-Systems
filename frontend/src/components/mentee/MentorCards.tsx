import React from 'react';

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
}

const MentorCards: React.FC = () => {
  const mentors: Mentor[] = [
    {
      id: '1',
      name: 'James Abugan',
      expertise: ['Web Dev', 'Computer Programming', 'App Dev']
    },
    {
      id: '2',
      name: 'John Doe',
      expertise: ['Database', 'Networking', 'Web Dev']
    },
    {
      id: '3',
      name: 'Jane Smith',
      expertise: ['Computer Programming', 'App Dev', 'Web Dev']
    },
    {
      id: '4',
      name: 'Mike Johnson',
      expertise: ['Networking', 'Database', 'Web Dev']
    },
    {
      id: '5',
      name: 'Sarah Williams',
      expertise: ['App Dev', 'Computer Programming', 'Database']
    },
    {
      id: '6',
      name: 'David Brown',
      expertise: ['Web Dev', 'Networking', 'Computer Programming']
    },
    {
      id: '7',
      name: 'Emily Davis',
      expertise: ['Database', 'App Dev', 'Web Dev']
    },
    {
      id: '8',
      name: 'Chris Miller',
      expertise: ['Networking', 'Web Dev', 'Database']
    },
    {
      id: '9',
      name: 'Lisa Anderson',
      expertise: ['Computer Programming', 'Database', 'App Dev']
    },
    {
      id: '10',
      name: 'Robert Taylor',
      expertise: ['Web Dev', 'Networking', 'App Dev']
    }
  ];

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-5 tw-gap-4 tw-mb-8">
      {mentors.map((mentor) => (
        <div
          key={mentor.id}
          className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow"
        >
          <div className="tw-flex tw-flex-col tw-items-center tw-text-center">
            <div className="tw-w-20 tw-h-20 tw-rounded-full tw-bg-gradient-to-br tw-from-purple-500 tw-to-blue-500 tw-mb-3 tw-flex tw-items-center tw-justify-center">
              <span className="tw-text-3xl">👤</span>
            </div>
            <h3 className="tw-font-bold tw-text-gray-900 tw-mb-2">{mentor.name}</h3>
            <p className="tw-text-xs tw-text-gray-600">
              {mentor.expertise.join(', ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MentorCards;

