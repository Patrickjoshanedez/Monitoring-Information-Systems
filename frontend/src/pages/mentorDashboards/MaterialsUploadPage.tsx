import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MaterialUpload from '../../features/materials/MaterialUpload';
import MentorMaterialsList from '../../features/materials/MentorMaterialsList';
import { useMentorSessions } from '../../shared/hooks/useMentorSessions';
import type { MentorSession } from '../../shared/services/sessionsService';

const MaterialsUploadPage: React.FC = () => {
    const { data: sessions = [], isLoading, isError, refetch } = useMentorSessions();
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [materialsFilter, setMaterialsFilter] = useState<string>('all');

    useEffect(() => {
        if (!selectedSessionId && sessions.length > 0) {
            setSelectedSessionId(sessions[0].id);
        }
    }, [sessions, selectedSessionId]);

    const formattedSessions = useMemo(() => {
        return sessions.map((session: MentorSession) => ({
            id: session.id,
            label: `${session.subject || 'Session'} — ${new Date(session.date).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            })}`,
        }));
    }, [sessions]);

    const handleUploadSuccess = (uploadCount: number) => {
        if (uploadCount > 0 && selectedSessionId) {
            setMaterialsFilter(selectedSessionId);
        }
    };

    return (
        <DashboardLayout>
            <div className="tw-max-w-4xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-6">
                <header className="tw-mb-6">
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Class materials</h1>
                    <p className="tw-text-sm tw-text-gray-600 tw-mt-2">
                        Upload handouts, slide decks, and reference files to share with mentees for each session.
                    </p>
                </header>

                <section className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-4">
                    <div>
                        <label htmlFor="session-select" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                            Select session
                        </label>
                        {isLoading && <p className="tw-text-sm tw-text-gray-500">Loading sessions…</p>}
                        {isError && (
                            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-p-3" role="alert">
                                <p className="tw-text-sm tw-text-red-700">Unable to load your sessions.</p>
                                <button
                                    type="button"
                                    onClick={() => refetch()}
                                    className="tw-mt-2 tw-text-sm tw-font-medium tw-text-red-700 hover:tw-text-red-900"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                        {!isLoading && !isError && formattedSessions.length === 0 && (
                            <p className="tw-text-sm tw-text-gray-500">
                                You don’t have any scheduled sessions yet. Once a session is created, you can attach materials here.
                            </p>
                        )}
                        {!isLoading && !isError && formattedSessions.length > 0 && (
                            <select
                                id="session-select"
                                className="tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                                value={selectedSessionId}
                                onChange={(event) => setSelectedSessionId(event.target.value)}
                                aria-label="Choose which session to attach materials to"
                            >
                                <option value="" disabled>
                                    Choose a session
                                </option>
                                {formattedSessions.map((session) => (
                                    <option key={session.id} value={session.id}>
                                        {session.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {selectedSessionId && formattedSessions.length > 0 && (
                        <MaterialUpload sessionId={selectedSessionId} onUploadSuccess={handleUploadSuccess} />
                    )}
                </section>

                <section className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-4">
                    <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-3">
                        <div>
                            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Manage files</h2>
                            <p className="tw-text-sm tw-text-gray-600">Preview, download, or remove shared materials.</p>
                        </div>
                        <div className="tw-flex tw-gap-2 tw-items-center">
                            <label htmlFor="materials-filter" className="tw-text-xs tw-font-medium tw-text-gray-600">
                                Show
                            </label>
                            <select
                                id="materials-filter"
                                className="tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                                value={materialsFilter}
                                onChange={(event) => setMaterialsFilter(event.target.value)}
                            >
                                <option value="all">All sessions</option>
                                {formattedSessions.map((session) => (
                                    <option key={`filter-${session.id}`} value={session.id}>
                                        {session.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <MentorMaterialsList sessionId={materialsFilter === 'all' ? undefined : materialsFilter} />
                </section>
            </div>
        </DashboardLayout>
    );
};

export default MaterialsUploadPage;
