import React from 'react';

const PopularMentors: React.FC = () => {
  const mentors = [
    {
      name: 'John Doe',
      year: '3rd Year',
      expertise: ['Web Development', 'Database Design', 'UI/UX'],
      avatar: '👨‍💻'
    },
    {
      name: 'Jane Smith',
      year: '4th Year',
      expertise: ['Mobile Development', 'Cloud Computing', 'DevOps'],
      avatar: '👩‍💻'
    },
    {
      name: 'Mike Johnson',
      year: '3rd Year',
      expertise: ['Data Science', 'Machine Learning', 'Python'],
      avatar: '👨‍🔬'
    }
  ];

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-8">
      <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-6">Popular Mentors</h2>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
        {mentors.map((mentor, index) => (
          <div
            key={index}
            className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-6 hover:tw-shadow-lg tw-transition-shadow"
          >
            <div className="tw-flex tw-items-center tw-mb-4">
              <div className="tw-text-5xl tw-mr-4">{mentor.avatar}</div>
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">{mentor.name}</h3>
                <p className="tw-text-sm tw-text-gray-600">{mentor.year}</p>
              </div>
            </div>
            <div className="tw-space-y-2 tw-mb-4">
              {mentor.expertise.map((skill, skillIndex) => (
                <span
                  key={skillIndex}
                  className="tw-inline-block tw-bg-purple-100 tw-text-purple-800 tw-text-xs tw-font-medium tw-px-3 tw-py-1 tw-rounded-full tw-mr-2"
                >
                  {skill}
                </span>
              ))}
            </div>
            <button className="tw-w-full tw-bg-primary hover:tw-bg-primary-dark tw-text-white tw-py-2 tw-px-4 tw-rounded-lg tw-font-medium tw-transition-colors">
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularMentors;

