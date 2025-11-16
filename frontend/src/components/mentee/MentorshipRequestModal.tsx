import React, { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { MentorProfile, MentorshipRequestPayload } from '../../shared/services/mentorMatching';
import logger from '../../shared/utils/logger';

export type MentorshipRequestModalProps = {
  open: boolean;
  mentor: MentorProfile | null;
  onClose: () => void;
  onSubmit: (payload: MentorshipRequestPayload) => Promise<unknown>;
  submitting?: boolean;
};

const EMPTY_FORM = {
  subject: '',
  preferredSlot: '',
  goals: '',
  notes: '',
};

const ERROR_MESSAGES: Record<string, string> = {
  APPLICATION_NOT_APPROVED: 'Your mentee application needs to be approved before you can send mentorship requests.',
  REQUEST_EXISTS: 'You already have an active request with this mentor.',
  MENTOR_NOT_AVAILABLE: 'This mentor is not available right now. Please pick another mentor.',
  FORBIDDEN: 'Only mentees can send mentorship requests.',
};

const MentorshipRequestModal: React.FC<MentorshipRequestModalProps> = ({ open, mentor, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const subjects = useMemo(() => mentor?.subjects ?? [], [mentor]);

  useEffect(() => {
    if (!open || !mentor) {
      setForm(EMPTY_FORM);
      setError(null);
      setSuccess(null);
      return;
    }

    setForm((prev) => ({
      ...prev,
      subject: subjects[0] || '',
    }));
    setError(null);
    setSuccess(null);
  }, [open, mentor, subjects]);

  if (!open || !mentor) {
    return null;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.subject) {
      setError('Please choose a subject so the mentor understands what you need help with.');
      return;
    }

    try {
      await onSubmit({
        mentorId: mentor.id,
        subject: form.subject,
        preferredSlot: form.preferredSlot ? form.preferredSlot.trim() : undefined,
        goals: form.goals ? form.goals.trim() : undefined,
        notes: form.notes ? form.notes.trim() : undefined,
      });
      setSuccess('Request sent! We will notify you and the mentor once there is an update.');
      setForm(EMPTY_FORM);
    } catch (submissionError) {
      logger.error('Mentorship request failed', submissionError);
      const axiosError = submissionError as AxiosError<{ message?: string; error?: string }>;
      const serverCode = axiosError?.response?.data?.error;
      const serverMessage = axiosError?.response?.data?.message;
      const friendlyMessage = (serverCode && ERROR_MESSAGES[serverCode]) || serverMessage;
      setError(friendlyMessage || 'Unable to submit request. Please try again.');
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-gray-900/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mentorship-request-title"
        className="tw-w-full tw-max-w-lg tw-rounded-2xl tw-bg-white tw-shadow-xl tw-border tw-border-gray-100 tw-p-6"
      >
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
          <div>
            <h2 id="mentorship-request-title" className="tw-text-xl tw-font-semibold tw-text-gray-900">
              Request mentorship
            </h2>
            <p className="tw-text-sm tw-text-gray-500">{mentor.fullName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tw-space-y-4">
          {error ? (
            <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-3 tw-text-sm tw-text-green-700">
              {success}
            </div>
          ) : null}

          <div>
            <label htmlFor="subject" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Subject or course
            </label>
            <select
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
              required
            >
              <option value="" disabled>
                Select a subject
              </option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
              {subjects.length === 0 ? (
                <option value={mentor.headline}>General mentorship ({mentor.headline})</option>
              ) : null}
            </select>
          </div>

          <div>
            <label htmlFor="preferredSlot" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Preferred session slot
            </label>
            <input
              id="preferredSlot"
              name="preferredSlot"
              value={form.preferredSlot}
              onChange={handleChange}
              placeholder="e.g. Wednesdays at 3:00 PM"
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="goals" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Learning goals
            </label>
            <textarea
              id="goals"
              name="goals"
              value={form.goals}
              onChange={handleChange}
              rows={3}
              placeholder="Briefly describe what you want to accomplish."
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Additional notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Share anything else the mentor should know."
              className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            />
          </div>

          <div className="tw-flex tw-justify-end tw-gap-3">
            <button
              type="button"
              onClick={onClose}
              className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tw-rounded-lg tw-bg-purple-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 disabled:tw-opacity-70"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorshipRequestModal;
