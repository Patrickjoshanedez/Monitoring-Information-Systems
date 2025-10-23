import React from 'react';

const PeopleBehind: React.FC = () => {
  const people = [
    { name: 'Dr. Sarah Williams', role: 'Program Director', avatar: '👩‍🎓' },
    { name: 'Prof. Michael Chen', role: 'Lead Mentor', avatar: '👨‍🏫' },
    { name: 'Dr. Emily Rodriguez', role: 'Academic Advisor', avatar: '👩‍💼' },
    { name: 'Prof. David Kim', role: 'Faculty Coordinator', avatar: '👨‍🏫' }
  ];

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6">
      <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-6">People Behind This</h2>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
        {people.map((person, index) => (
          <div
            key={index}
            className="tw-text-center"
          >
            <div className="tw-text-6xl tw-mb-4">{person.avatar}</div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-1">{person.name}</h3>
            <p className="tw-text-sm tw-text-gray-600">{person.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeopleBehind;

