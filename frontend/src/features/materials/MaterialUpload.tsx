import React, { useCallback, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useUploadSessionMaterials } from '../../hooks/useMaterials';

interface MaterialUploadProps {
    sessionId: string;
    menteeIds?: string[];
}

const MaterialUpload: React.FC<MaterialUploadProps> = ({ sessionId, menteeIds }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const uploadMutation = useUploadSessionMaterials(sessionId);

    const onFilesSelected = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        setError(null);
        const next = Array.from(selectedFiles);
        setFiles(next);
    }, []);

    const handleSubmit = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            if (!files.length) {
                setError('Please select at least one file to upload.');
                return;
            }
            try {
                await uploadMutation.mutateAsync({ files, menteeIds });
                setError(null);
                setFiles([]);
            } catch (unknownError) {
                if (axios.isAxiosError(unknownError)) {
                    if (unknownError.code === 'ECONNABORTED') {
                        setError('Upload is taking longer than expected. Please check your connection and try again.');
                        return;
                    }

                    const apiMessage =
                        (unknownError.response?.data as { message?: string; error?: string } | undefined)?.message ||
                        (unknownError.response?.data as { message?: string; error?: string } | undefined)?.error;

                    setError(apiMessage || unknownError.message || 'Upload failed.');
                    return;
                }

                const fallbackMessage = unknownError instanceof Error ? unknownError.message : 'Upload failed.';
                setError(fallbackMessage);
            }
        },
        [files, menteeIds, uploadMutation],
    );

    const isLoading = uploadMutation.isPending;

    return (
        <form onSubmit={handleSubmit} className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-4">
            <div>
                <label htmlFor="materials" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Upload materials
                </label>
                <input
                    id="materials"
                    name="materials"
                    type="file"
                    multiple
                    onChange={(e) => onFilesSelected(e.target.files)}
                    className="tw-block tw-w-full tw-text-sm tw-text-gray-900 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500 tw-cursor-pointer tw-bg-gray-50"
                    aria-describedby={error ? 'materials-error' : undefined}
                />
                {error && (
                    <p id="materials-error" className="tw-mt-2 tw-text-sm tw-text-red-600" role="alert">
                        {error}
                    </p>
                )}
            </div>

            <div className="tw-flex tw-items-center tw-justify-between">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-2 tw-border tw-border-transparent tw-text-sm tw-font-medium tw-rounded-md tw-text-white tw-bg-blue-600 hover:tw-bg-blue-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                >
                    {isLoading ? 'Uploading…' : 'Upload'}
                </button>
                {files.length > 0 && (
                    <span className="tw-text-xs tw-text-gray-500" aria-live="polite">
                        {files.length} file(s) selected
                    </span>
                )}
            </div>
        </form>
    );
};

MaterialUpload.propTypes = {
    sessionId: PropTypes.string.isRequired,
    menteeIds: PropTypes.arrayOf(PropTypes.string),
};

export default React.memo(MaterialUpload);
