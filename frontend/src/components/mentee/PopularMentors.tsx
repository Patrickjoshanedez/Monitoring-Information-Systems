import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMentorDirectory, MentorProfile } from '../../shared/services/mentorMatching';

const PopularMentors: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['popular-mentors'],
    queryFn: () => fetchMentorDirectory({}),
    staleTime: 5 * 60 * 1000,
  });

  const mentors: MentorProfile[] = (data?.mentors ?? [])
    .slice()
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-8">
      <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-6">Popular Mentors</h2>
      {isLoading ? (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
              <div className="tw-h-6 tw-w-2/3 tw-bg-gray-100 tw-rounded tw-mb-4 tw-animate-pulse" />
              <div className="tw-space-y-2">
                <div className="tw-h-3 tw-w-full tw-bg-gray-100 tw-rounded" />
                <div className="tw-h-3 tw-w-4/5 tw-bg-gray-100 tw-rounded" />
                <div className="tw-h-3 tw-w-3/5 tw-bg-gray-100 tw-rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-6 hover:tw-shadow-lg tw-transition-shadow">
              <div className="tw-flex tw-items-center tw-mb-3">
                <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-gradient-to-br tw-from-purple-500 tw-to-blue-500 tw-text-white tw-text-xl">
                  {mentor.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="tw-ml-3">
                  <h3 className="tw-text-base tw-font-semibold tw-text-gray-900">{mentor.fullName}</h3>
                  <p className="tw-text-xs tw-text-gray-600">⭐ {mentor.rating?.toFixed(1)} ({mentor.reviewCount})</p>
                </div>
              </div>
              <p className="tw-text-sm tw-text-gray-600 tw-mb-3">{mentor.headline}</p>
              <div className="tw-space-x-2 tw-space-y-2 tw-mb-4">
                {mentor.subjects.slice(0, 3).map((skill) => (
                  <span key={skill} className="tw-inline-block tw-bg-purple-100 tw-text-purple-800 tw-text-xs tw-font-medium tw-px-3 tw-py-1 tw-rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="tw-text-right tw-text-xs tw-text-gray-500">{mentor.languages.join(', ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PopularMentors;

