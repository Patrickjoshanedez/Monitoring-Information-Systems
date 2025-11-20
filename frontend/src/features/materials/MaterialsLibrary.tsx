import React, { useCallback, useMemo, useState } from 'react';
import { buildPreviewUrl, useMenteeMaterials } from '../../hooks/useMaterials';
import { useToast } from '../../hooks/useToast';

const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return 'Unknown size';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / 1024 ** index;
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value?: string | null): string => {
    if (!value) {
        return 'Date TBA';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Date TBA';
    }
    return parsed.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const MaterialsLibrary: React.FC = () => {
    const [search, setSearch] = useState('');
    const [sessionFilter, setSessionFilter] = useState<string>('');
    const { data, isLoading, isFetching, isError, refetch } = useMenteeMaterials({
        search: search.trim() || undefined,
        sessionId: sessionFilter || undefined,
    });
    const { showToast } = useToast();

    const materials = data?.materials ?? [];
    const sessions = useMemo(() => data?.sessions ?? [], [data]);

    const handlePreview = useCallback(
        (title: string) => {
            showToast({ message: `Opening ${title} in a new tab.`, variant: 'info' });
        },
        [showToast]
    );

    const handleDownload = useCallback(
        (url: string | undefined, title: string) => {
            if (!url) {
                showToast({ message: 'Download link is not available yet.', variant: 'info' });
                return;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
            showToast({ message: `Downloading ${title}…`, variant: 'success', durationMs: 2500 });
        },
        [showToast]
    );

    const handleSessionChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        setSessionFilter(event.target.value);
    }, []);

    if (isLoading) {
        return (
            <div className="tw-flex tw-justify-center tw-items-center tw-p-8">
                <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b-2 tw-border-blue-500" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                    <div className="tw-flex tw-items-center tw-gap-2">
                        <span className="tw-text-red-600" aria-hidden="true">
                            ⚠️
                        </span>
                        <span className="tw-text-red-800">Unable to load materials right now.</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="tw-text-sm tw-font-medium tw-text-red-700 hover:tw-text-red-900"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-2xl tw-shadow-sm tw-p-4 md:tw-p-6">
            <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-items-start lg:tw-items-center lg:tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                    <label htmlFor="materials-search" className="tw-text-sm tw-font-medium tw-text-gray-700">
                        Search
                    </label>
                    <input
                        id="materials-search"
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Keyword or file name"
                        className="tw-w-60 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                    />
                </div>
                <div className="tw-flex tw-items-center tw-gap-2">
                    <label htmlFor="materials-session-filter" className="tw-text-sm tw-font-medium tw-text-gray-700">
                        Session
                    </label>
                    <select
                        id="materials-session-filter"
                        value={sessionFilter}
                        onChange={handleSessionChange}
                        className="tw-min-w-[12rem] tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                    >
                        <option value="">All sessions</option>
                        {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                                {session.subject} • {formatDate(session.date)}
                            </option>
                        ))}
                    </select>
                </div>
                {isFetching && (
                    <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-gray-500" role="status" aria-live="polite">
                        <span className="tw-animate-spin tw-rounded-full tw-h-4 tw-w-4 tw-border-b-2 tw-border-purple-500" />
                        Syncing latest files…
                    </div>
                )}
            </div>

            {materials.length === 0 ? (
                <div className="tw-text-center tw-text-sm tw-text-gray-500 tw-py-10">
                    {sessionFilter
                        ? 'No files have been shared for this session yet.'
                        : 'No shared materials yet. Your mentor will upload files here once they are ready.'}
                </div>
            ) : (
                <ul className="tw-mt-4 tw-space-y-3" role="list">
                    {materials.map((material) => (
                        <li
                            key={material.id}
                            className="tw-border tw-border-gray-100 tw-rounded-xl tw-p-4 tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between tw-gap-4"
                        >
                            <div className="tw-space-y-1">
                                <p className="tw-text-base tw-font-semibold tw-text-gray-900">{material.title}</p>
                                <p className="tw-text-sm tw-text-gray-600">
                                    Uploaded by {material.mentorName || 'your mentor'}
                                    {material.mentorEmail ? ` • ${material.mentorEmail}` : ''}
                                </p>
                                <p className="tw-text-xs tw-text-gray-500">
                                    {material.sessionSubject ? `${material.sessionSubject} • ${formatDate(material.sessionDate)}` : 'Not linked to a specific session'}
                                </p>
                                <p className="tw-text-xs tw-text-gray-400">
                                    {material.mimeType} • {formatBytes(material.fileSize)}
                                </p>
                            </div>
                            <div className="tw-flex tw-items-center tw-gap-3">
                                <a
                                    href={buildPreviewUrl(material.id)}
                                    onClick={() => handlePreview(material.title)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-purple-600 tw-text-purple-600 hover:tw-bg-purple-50 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-transition-colors"
                                >
                                    Preview
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleDownload(material.googleDriveDownloadLink, material.title)}
                                    disabled={!material.googleDriveDownloadLink}
                                    className={`tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-transition-colors ${
                                        material.googleDriveDownloadLink
                                            ? 'tw-bg-purple-600 tw-text-white hover:tw-bg-purple-700'
                                            : 'tw-bg-gray-200 tw-text-gray-500 tw-cursor-not-allowed'
                                    }`}
                                >
                                    Download
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default React.memo(MaterialsLibrary);
