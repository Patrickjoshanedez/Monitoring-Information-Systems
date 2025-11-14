import React, { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { uploadMaterial, UploadMaterialPayload } from '../../shared/services/materialsService';

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;

const sanitizeTags = (value: string) =>
    value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 20);

const MaterialsUploadPage: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<'shared' | 'mentor-only'>('shared');
    const [tagsInput, setTagsInput] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [menteeId, setMenteeId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const tagList = useMemo(() => sanitizeTags(tagsInput), [tagsInput]);

    const uploadMutation = useMutation({
        mutationFn: (payload: UploadMaterialPayload) => uploadMaterial(payload),
        onSuccess: (data) => {
            setSuccessMessage(`Material "${data.title}" uploaded successfully.`);
            setError('');
            setTitle('');
            setDescription('');
            setTagsInput('');
            setSessionId('');
            setMenteeId('');
            setFile(null);
        },
        onError: (mutationError: unknown) => {
            const fallbackMessage = 'Upload failed. Please try again.';
            if (mutationError && typeof mutationError === 'object') {
                const maybeResponse = (mutationError as { response?: { data?: { message?: string } } }).response;
                const apiMessage = maybeResponse?.data?.message;
                const errorMessage = (mutationError as { message?: string }).message;
                setError(apiMessage || errorMessage || fallbackMessage);
            } else {
                setError(fallbackMessage);
            }
            setSuccessMessage('');
        }
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');
        if (!file) {
            setError('Please choose a file to upload.');
            return;
        }
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }

        uploadMutation.mutate({
            title: title.trim().slice(0, MAX_TITLE_LENGTH),
            description: description.trim() ? description.trim().slice(0, MAX_DESCRIPTION_LENGTH) : undefined,
            visibility,
            file,
            menteeId: menteeId.trim() || undefined,
            sessionId: sessionId.trim() || undefined,
            tags: tagList
        });
    };

    return (
        <DashboardLayout>
            <div className="tw-max-w-3xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
                <header className="tw-mb-6">
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Upload learning materials</h1>
                    <p className="tw-text-sm tw-text-gray-600 tw-mt-2">
                        Share resources with your mentees. Files can be visible to everyone linked to the session or restricted
                        to you.
                    </p>
                </header>

                {error && (
                    <div
                        className="tw-mb-4 tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-4 tw-text-sm tw-text-red-700"
                        role="alert"
                    >
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div
                        className="tw-mb-4 tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-4 tw-text-sm tw-text-green-700"
                        role="status"
                    >
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="tw-space-y-6" noValidate>
                    <fieldset className="tw-space-y-4">
                        <legend className="tw-text-base tw-font-semibold tw-text-gray-900">Material details</legend>
                        <div>
                            <label htmlFor="title" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Title<span className="tw-text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                maxLength={MAX_TITLE_LENGTH}
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                rows={4}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="file" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Upload file<span className="tw-text-red-500">*</span>
                            </label>
                            <input
                                id="file"
                                name="file"
                                type="file"
                                required
                                onChange={(event) => {
                                    const selected = event.target.files && event.target.files[0];
                                    setFile(selected ?? null);
                                }}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                            />
                            {file && (
                                <p className="tw-mt-1 tw-text-xs tw-text-gray-500" aria-live="polite">
                                    Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                                </p>
                            )}
                        </div>
                    </fieldset>

                    <fieldset className="tw-space-y-4">
                        <legend className="tw-text-base tw-font-semibold tw-text-gray-900">Sharing</legend>
                        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4">
                            <label className="tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-text-sm tw-text-gray-700">
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="shared"
                                    checked={visibility === 'shared'}
                                    onChange={() => setVisibility('shared')}
                                    className="tw-mt-1"
                                />
                                <span>
                                    <span className="tw-font-semibold tw-text-gray-900">Shared with mentees</span>
                                    <span className="tw-block tw-text-xs tw-text-gray-500">
                                        Visible to mentees linked to this session or assignment.
                                    </span>
                                </span>
                            </label>
                            <label className="tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-text-sm tw-text-gray-700">
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="mentor-only"
                                    checked={visibility === 'mentor-only'}
                                    onChange={() => setVisibility('mentor-only')}
                                    className="tw-mt-1"
                                />
                                <span>
                                    <span className="tw-font-semibold tw-text-gray-900">Mentor only</span>
                                    <span className="tw-block tw-text-xs tw-text-gray-500">Keep privately stored for later use.</span>
                                </span>
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className="tw-space-y-4">
                        <legend className="tw-text-base tw-font-semibold tw-text-gray-900">Optional metadata</legend>
                        <div>
                            <label htmlFor="tags" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Tags
                            </label>
                            <input
                                id="tags"
                                name="tags"
                                type="text"
                                value={tagsInput}
                                onChange={(event) => setTagsInput(event.target.value)}
                                placeholder="e.g., arrays, recursion, sprint-2"
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                            />
                            {tagList.length > 0 && <p className="tw-mt-1 tw-text-xs tw-text-gray-500">{tagList.join(', ')}</p>}
                        </div>
                        <div>
                            <label htmlFor="sessionId" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Session ID
                            </label>
                            <input
                                id="sessionId"
                                name="sessionId"
                                type="text"
                                value={sessionId}
                                onChange={(event) => setSessionId(event.target.value)}
                                placeholder="Optional session reference"
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="menteeId" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Assign to mentee
                            </label>
                            <input
                                id="menteeId"
                                name="menteeId"
                                type="text"
                                value={menteeId}
                                onChange={(event) => setMenteeId(event.target.value)}
                                placeholder="Optional mentee user ID"
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                            />
                        </div>
                    </fieldset>

                    <div className="tw-flex tw-items-center tw-gap-3">
                        <button
                            type="submit"
                            disabled={uploadMutation.isLoading}
                            className="tw-inline-flex tw-items-center tw-rounded-lg tw-bg-purple-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-70"
                        >
                            {uploadMutation.isLoading ? 'Uploading...' : 'Upload material'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTitle('');
                                setDescription('');
                                setTagsInput('');
                                setSessionId('');
                                setMenteeId('');
                                setFile(null);
                                setError('');
                                setSuccessMessage('');
                            }}
                            className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-600 hover:tw-border-gray-300"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default MaterialsUploadPage;
