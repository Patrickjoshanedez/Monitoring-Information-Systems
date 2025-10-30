import React, { useMemo, useState } from 'react';
import useMentorDirectory from '../../features/mentorship/hooks/useMentorDirectory';
import { MentorProfile } from '../../shared/services/mentorMatching';
import MentorCards from './MentorCards';
import MentorshipRequestModal from './MentorshipRequestModal';

const MentorDirectorySection: React.FC = () => {
  const {
    mentors,
    filters,
    setFilter,
    resetFilters,
    options,
    meta,
    isLoading,
    isRefetching,
    submitRequest,
    isSubmittingRequest,
  } = useMentorDirectory();

  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);

  const handleRequestClick = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
  };

  const handleModalClose = () => {
    setSelectedMentor(null);
  };

  const handleSubmit = async (payload: Parameters<typeof submitRequest>[0]) => {
    await submitRequest(payload);
  };

  const filterChips = useMemo(() => {
    const chips: string[] = [];
    if (filters.subject) chips.push(`Subject: ${filters.subject}`);
    if (filters.language) chips.push(`Language: ${filters.language}`);
    if (filters.availability) chips.push(`Availability: ${filters.availability}`);
    if (filters.minRating) chips.push(`Rating ≥ ${filters.minRating}`);
    return chips;
  }, [filters]);

  return (
    <section className="tw-mt-10">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3 tw-mb-4">
        <div>
          <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-900">Find a mentor</h2>
          <p className="tw-text-sm tw-text-gray-500">
            Apply filters to match mentors based on focus area, availability, and language preferences.
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
            aria-label="Reset mentor filters"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="tw-grid tw-gap-4 tw-bg-white tw-rounded-2xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4 md:tw-p-6">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-5 tw-gap-4">
          <div className="tw-col-span-2">
            <label htmlFor="mentor-search" className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Search mentors
            </label>
            <input
              id="mentor-search"
              name="search"
              value={filters.search}
              onChange={(event) => setFilter('search', event.target.value)}
              placeholder="Search by name or subject"
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="subject-filter" className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Subject
            </label>
            <select
              id="subject-filter"
              value={filters.subject}
              onChange={(event) => setFilter('subject', event.target.value)}
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <option value="">All subjects</option>
              {options.subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="availability-filter" className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Availability
            </label>
            <select
              id="availability-filter"
              value={filters.availability}
              onChange={(event) => setFilter('availability', event.target.value)}
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <option value="">Any time</option>
              {options.availability.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="language-filter" className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Language
            </label>
            <select
              id="language-filter"
              value={filters.language}
              onChange={(event) => setFilter('language', event.target.value)}
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <option value="">Any language</option>
              {options.languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rating-filter" className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Minimum rating
            </label>
            <select
              id="rating-filter"
              value={filters.minRating}
              onChange={(event) => setFilter('minRating', Number(event.target.value))}
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <option value={0}>Any rating</option>
              {options.ratings.map((rating) => (
                <option key={rating} value={rating}>
                  {rating.toFixed(1)}+
                </option>
              ))}
            </select>
          </div>
        </div>

        {filterChips.length ? (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {filterChips.map((chip) => (
              <span
                key={chip}
                className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-purple-50 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-purple-700"
              >
                {chip}
                <button
                  type="button"
                  onClick={() => {
                    if (chip.startsWith('Subject')) setFilter('subject', '');
                    if (chip.startsWith('Language')) setFilter('language', '');
                    if (chip.startsWith('Availability')) setFilter('availability', '');
                    if (chip.startsWith('Rating')) setFilter('minRating', 0);
                  }}
                  className="tw-text-purple-500 hover:tw-text-purple-700"
                  aria-label={`Remove ${chip}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {meta?.message ? (
          <div className="tw-rounded-lg tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-3 tw-text-sm tw-text-amber-800">
            {meta.message}
          </div>
        ) : null}

        <div className="tw-flex tw-items-center tw-justify-between tw-text-sm tw-text-gray-500">
          <span>
            Showing {mentors.length} {mentors.length === 1 ? 'mentor' : 'mentors'}
            {filters.minRating ? ` • Rating ≥ ${filters.minRating}` : ''}
          </span>
          {isRefetching ? <span className="tw-animate-pulse">Refreshing…</span> : null}
        </div>

        <MentorCards
          mentors={mentors}
          loading={isLoading || isRefetching}
          onRequest={handleRequestClick}
        />

        {!mentors.length && !isLoading ? (
          <div className="tw-text-center tw-text-sm tw-text-gray-500 tw-py-6">
            No mentors match the selected filters. Try adjusting your criteria.
          </div>
        ) : null}
      </div>

      <MentorshipRequestModal
        open={Boolean(selectedMentor)}
        mentor={selectedMentor}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        submitting={isSubmittingRequest}
      />
    </section>
  );
};

export default MentorDirectorySection;
