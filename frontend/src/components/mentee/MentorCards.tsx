import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatThreads } from '../../shared/hooks/useChatThreads';
import { MentorProfile } from '../../shared/services/mentorMatching';

interface MentorCardsProps {
  mentors: MentorProfile[];
  loading?: boolean;
  onRequest?: (mentor: MentorProfile) => void;
  requestDisabledReason?: string;
}

const MentorCards: React.FC<MentorCardsProps> = ({ mentors, loading, onRequest, requestDisabledReason }) => {
  const navigate = useNavigate();
  const { startConversation } = useChatThreads();
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<{ mentorId: string; message: string } | null>(null);

  const handleChatStart = useCallback(
    async (mentorId: string) => {
      setChatError(null);
      setChatLoadingId(mentorId);
      try {
        const thread = await startConversation.mutateAsync({ participantId: mentorId });
        navigate(`/mentee/chat?threadId=${thread.id}`);
      } catch (error) {
        const fallbackMessage = 'Unable to open chat right now. Please try again in a moment.';
        const apiMessage =
          typeof (error as { response?: { data?: { message?: string } } })?.response?.data?.message === 'string'
            ? (error as { response?: { data?: { message?: string } } }).response!.data!.message
            : null;
        setChatError({
          mentorId,
          message: apiMessage || (error instanceof Error && error.message ? error.message : fallbackMessage),
        });
      } finally {
        setChatLoadingId((current) => (current === mentorId ? null : current));
      }
    },
    [navigate, startConversation]
  );

  if (loading) {
    return (
      <div className="tw-space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="tw-animate-pulse tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4"
          >
            <div className="tw-flex tw-items-center tw-gap-4">
              <div className="tw-h-14 tw-w-14 tw-rounded-full tw-bg-gray-200" />
              <div className="tw-flex-1">
                <div className="tw-h-4 tw-w-1/2 tw-rounded tw-bg-gray-200 tw-mb-2" />
                <div className="tw-h-3 tw-w-1/3 tw-rounded tw-bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tw-space-y-4">
      {mentors.map((mentor) => {
        const nextSlot = mentor.nextAvailableSlot
          ? new Date(mentor.nextAvailableSlot).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : null;
        const expertiseHighlights = (mentor.expertiseAreas && mentor.expertiseAreas.length ? mentor.expertiseAreas : mentor.subjects).slice(0, 3);
        const experienceHeadline = (mentor.experienceSummary && mentor.experienceSummary.trim())
          ? mentor.experienceSummary.trim()
          : mentor.experienceYears
            ? `${mentor.experienceYears}+ years guiding mentees`
            : '';

        return (
          <article
            key={mentor.id}
            className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 lg:tw-p-5 tw-shadow-sm tw-transition-all hover:tw-shadow-lg"
          >
            <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 lg:tw-items-center">
              <div className="tw-flex tw-gap-4 tw-flex-1">
                <div className="tw-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-full tw-bg-gradient-to-br tw-from-purple-500 tw-to-blue-500 tw-text-white tw-text-xl">
                  {mentor.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="tw-flex-1">
                  <h3 className="tw-text-base tw-font-semibold tw-text-gray-900">{mentor.fullName}</h3>
                  <p className="tw-text-sm tw-text-gray-500">{mentor.headline}</p>
                  <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-gray-500">
                    {mentor.rating ? (
                      <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-amber-50 tw-px-2 tw-py-1 tw-font-medium tw-text-amber-700">
                        ⭐ {mentor.rating.toFixed(1)} ({mentor.reviewCount} reviews)
                      </span>
                    ) : null}
                    {nextSlot ? (
                      <span className="tw-flex tw-items-center tw-gap-1">
                        <span className="tw-inline-block tw-h-2 tw-w-2 tw-rounded-full tw-bg-emerald-400" />
                        Next slot {nextSlot}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <dl className="tw-grid tw-grid-cols-2 tw-gap-3 tw-text-xs sm:tw-text-sm lg:tw-w-96">
                <div className="tw-rounded-xl tw-bg-gray-50 tw-p-3">
                  <dt className="tw-text-[11px] tw-font-medium tw-text-gray-500">Focus areas</dt>
                  <dd className="tw-mt-1 tw-text-gray-700 tw-truncate" title={mentor.subjects.join(', ')}>
                    {mentor.subjects.join(', ')}
                  </dd>
                </div>
                <div className="tw-rounded-xl tw-bg-gray-50 tw-p-3">
                  <dt className="tw-text-[11px] tw-font-medium tw-text-gray-500">Languages</dt>
                  <dd className="tw-mt-1 tw-text-gray-700 tw-truncate" title={mentor.languages.join(', ')}>
                    {mentor.languages.join(', ')}
                  </dd>
                </div>
                <div className="tw-col-span-2 tw-rounded-xl tw-bg-gray-50 tw-p-3">
                  <dt className="tw-text-[11px] tw-font-medium tw-text-gray-500">Availability</dt>
                  <dd className="tw-mt-1 tw-text-gray-700 tw-truncate" title={mentor.availability.join(', ') || undefined}>
                    {mentor.availability.length ? mentor.availability.join(', ') : 'Availability updates soon'}
                  </dd>
                </div>
              </dl>

              <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full lg:tw-w-52">
                {onRequest ? (
                  <button
                    type="button"
                    onClick={() => onRequest(mentor)}
                    className={`tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 tw-bg-purple-600 hover:tw-bg-purple-700 focus:tw-ring-purple-500 ${requestDisabledReason ? 'tw-opacity-80' : ''}`}
                    title={requestDisabledReason}
                    aria-describedby={requestDisabledReason ? `mentor-card-warning-${mentor.id}` : undefined}
                  >
                    Request mentorship
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleChatStart(mentor.id)}
                  className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-4 tw-py-2 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200 disabled:tw-opacity-60"
                  disabled={chatLoadingId === mentor.id || startConversation.isPending}
                >
                  {chatLoadingId === mentor.id ? 'Opening chat…' : 'Open chat'}
                </button>
              </div>
            </div>

            <div className="tw-mt-4 tw-rounded-2xl tw-border tw-border-dashed tw-border-purple-200 tw-bg-purple-50/40 tw-p-4">
              <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-gap-3">
                <div>
                  <p className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-purple-700">Experience</p>
                  <p className="tw-text-sm tw-font-semibold tw-text-gray-900">
                    {experienceHeadline || 'Experience details shared soon'}
                  </p>
                </div>
                {expertiseHighlights.length ? (
                  <div className="tw-flex tw-flex-wrap tw-gap-2">
                    {expertiseHighlights.map((subject) => (
                      <span
                        key={`${mentor.id}-${subject}`}
                        className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-white tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-purple-700 tw-shadow-sm"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="tw-mt-3 tw-text-sm tw-text-gray-600">
                {mentor.bioSnippet?.trim() || experienceHeadline || 'This mentor is updating their expertise summary.'}
              </p>
            </div>

            {requestDisabledReason ? (
              <p
                id={`mentor-card-warning-${mentor.id}`}
                className="tw-mt-3 tw-text-xs tw-text-amber-700"
              >
                {requestDisabledReason}
              </p>
            ) : null}
            {chatError?.mentorId === mentor.id ? (
              <p className="tw-mt-1 tw-text-xs tw-text-red-600" role="alert">
                {chatError.message}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
};

export default MentorCards;

