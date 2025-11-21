import React, { useEffect, useMemo, useState } from 'react';
import { useMentorFeedbackForSession, useCreateMentorFeedback, useUpdateMentorFeedback } from '../../shared/hooks/useMentorFeedback';
import type { MentorFeedbackRecord } from '../../shared/services/mentorFeedbackService';

type Props = {
    sessionId: string;
    sessionSubject?: string | null;
    onClose: () => void;
};

const MentorFeedbackForm: React.FC<Props> = ({ sessionId, sessionSubject, onClose }) => {
    const { data: existing, isLoading: isLoadingExisting } = useMentorFeedbackForSession(sessionId, { enabled: true });
    const createFeedback = useCreateMentorFeedback();
    const updateFeedback = useUpdateMentorFeedback();

    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [formError, setFormError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (existing) {
            setRating(existing.rating || 0);
            setComment(existing.comment || '');
            setVisibility(existing.visibility || 'public');
        }
    }, [existing]);

    const isEdit = useMemo(() => Boolean(existing && existing.id), [existing]);

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setFormError(null);

        if (!rating || rating < 1 || rating > 5) {
            setFormError('Please select a rating between 1 and 5.');
            return;
        }

        const payload = {
            sessionId,
            rating,
            comment: comment.trim() || null,
            visibility,
        };

        try {
            if (isEdit) {
                await updateFeedback.mutateAsync(payload);
                setSuccessMsg('Feedback updated.');
            } else {
                await createFeedback.mutateAsync(payload);
                setSuccessMsg('Feedback submitted.');
            }

            setTimeout(() => {
                onClose();
            }, 700);
        } catch (err: any) {
            setFormError(err?.response?.data?.message || err?.message || 'Unable to submit feedback.');
        }
    };

    if (isLoadingExisting) {
        return (
            <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40">
                <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-w-full tw-max-w-lg">Loading…</div>
            </div>
        );
    }

    return (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40" role="dialog" aria-modal="true">
            <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-xl tw-p-6">
                <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
                    <div>
                        <p className="tw-text-sm tw-font-semibold tw-text-primary">Mentor feedback</p>
                        <h3 className="tw-text-lg tw-font-bold tw-text-gray-900">{sessionSubject || 'Session feedback'}</h3>
                        <p className="tw-text-xs tw-text-gray-500">Share a short evaluation for the mentee.</p>
                    </div>
                    <button type="button" onClick={onClose} className="tw-text-gray-400 hover:tw-text-gray-600" aria-label="Close">×</button>
                </div>

                {formError ? (
                    <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700 tw-mb-3">{formError}</div>
                ) : null}

                {successMsg ? (
                    <div className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-3 tw-text-sm tw-text-green-700 tw-mb-3">{successMsg}</div>
                ) : null}

                <form onSubmit={handleSubmit} className="tw-space-y-4">
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700">Rating</label>
                        <div className="tw-flex tw-gap-2 tw-mt-2" role="radiogroup" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <label key={value} className="tw-cursor-pointer">
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={value}
                                        checked={rating === value}
                                        onChange={() => setRating(value)}
                                        className="tw-sr-only"
                                    />
                                    <span aria-hidden className={`tw-text-3xl ${value <= rating ? 'tw-text-amber-400' : 'tw-text-gray-300'}`}>★</span>
                                    <span className="tw-sr-only">{value} star{value>1?'s':''}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="mentor-feedback-comment" className="tw-text-sm tw-font-medium tw-text-gray-700">Notes (optional)</label>
                        <textarea
                            id="mentor-feedback-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                            placeholder="Examples: progress against goals, focus areas, next steps"
                        />
                        <p className="tw-text-right tw-text-xs tw-text-gray-400">{comment.length}/2000</p>
                    </div>

                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Visibility</label>
                        <div className="tw-flex tw-gap-4">
                            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
                                <input type="radio" name="visibility" value="public" checked={visibility==='public'} onChange={() => setVisibility('public')} />
                                <span>Visible to mentee</span>
                            </label>
                            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
                                <input type="radio" name="visibility" value="private" checked={visibility==='private'} onChange={() => setVisibility('private')} />
                                <span>Private (admins only)</span>
                            </label>
                        </div>
                    </div>

                    <div className="tw-flex tw-justify-end tw-gap-3">
                        <button type="button" onClick={onClose} className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50">Cancel</button>
                        <button type="submit" disabled={createFeedback.isLoading || updateFeedback.isLoading} className="tw-rounded-lg tw-bg-primary tw-text-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold hover:tw-bg-primary/90 disabled:tw-opacity-60">{isEdit ? (updateFeedback.isLoading ? 'Saving…' : 'Save feedback') : (createFeedback.isLoading ? 'Submitting…' : 'Submit feedback')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MentorFeedbackForm;
