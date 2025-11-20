import React, { useState } from 'react';
import {
    useAchievements,
    useCertificates,
    useIssueCertificate,
    useRequestCertificateReissue,
} from '../../hooks/useCertificates';
import { downloadCertificate, IssueCertificatePayload } from '../../shared/services/certificatesService';
import { useToast } from '../../hooks/useToast';

const formatDate = (value?: string) => {
    if (!value) {
        return 'Pending issuance';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Pending issuance';
    }
    return parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const RecognitionPanel: React.FC = () => {
    const { data: certificates = [], isLoading: certificatesLoading, isError: certificatesError, refetch: refetchCertificates } = useCertificates();
    const { data: achievements = [], isLoading: achievementsLoading, isError: achievementsError, refetch: refetchAchievements } = useAchievements();
    const issueCertificate = useIssueCertificate();
    const requestReissue = useRequestCertificateReissue();
    const { showToast } = useToast();

    const [issuePayload, setIssuePayload] = useState<IssueCertificatePayload>({
        programName: 'Mentorship Program',
        certificateType: 'completion',
    });

    const handleDownload = async (certificateId: string) => {
        try {
            await downloadCertificate(certificateId);
            showToast({ message: 'Downloading certificate…', variant: 'info' });
        } catch (error: any) {
            showToast({ message: error?.message || 'Download failed. Please try again.', variant: 'error' });
        }
    };

    const handleIssueRequest = async () => {
        try {
            await issueCertificate.mutateAsync(issuePayload);
            showToast({ message: 'Certificate request submitted. We will notify you once ready.', variant: 'success' });
        } catch (error: any) {
            showToast({ message: error?.message || 'Unable to submit request.', variant: 'error' });
        }
    };

    const handleReissueRequest = async (certificateId: string) => {
        try {
            await requestReissue.mutateAsync({ certificateId });
            showToast({ message: 'Reissue request sent to your mentor.', variant: 'success' });
        } catch (error: any) {
            showToast({ message: error?.message || 'Unable to request reissue.', variant: 'error' });
        }
    };

    return (
        <section className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-2xl tw-shadow-sm tw-p-6 tw-mb-8">
            <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-6 tw-justify-between">
                <div className="tw-space-y-2">
                    <p className="tw-text-sm tw-font-semibold tw-text-primary tw-uppercase">Recognition</p>
                    <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Certificates & Achievements</h2>
                    <p className="tw-text-sm tw-text-gray-600">
                        Download your certificates, celebrate milestones, and keep motivation high with badges you earn along the way.
                    </p>
                </div>
                <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3">
                    <div className="tw-flex tw-flex-col tw-gap-2">
                        <label htmlFor="certificateType" className="tw-text-xs tw-font-medium tw-text-gray-600">
                            Certificate type
                        </label>
                        <select
                            id="certificateType"
                            value={issuePayload.certificateType}
                            onChange={(event) =>
                                setIssuePayload((prev) => ({
                                    ...prev,
                                    certificateType: event.target.value as IssueCertificatePayload['certificateType'],
                                }))
                            }
                            className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary"
                        >
                            <option value="completion">Completion</option>
                            <option value="participation">Participation</option>
                            <option value="excellence">Excellence</option>
                        </select>
                    </div>
                    <div className="tw-flex tw-flex-col tw-gap-2">
                        <label htmlFor="programName" className="tw-text-xs tw-font-medium tw-text-gray-600">
                            Program / Cohort
                        </label>
                        <input
                            id="programName"
                            type="text"
                            value={issuePayload.programName}
                            onChange={(event) => setIssuePayload((prev) => ({ ...prev, programName: event.target.value }))}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-primary"
                            placeholder="Mentorship Program"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleIssueRequest}
                        disabled={issueCertificate.isLoading || !issuePayload.programName.trim()}
                        className="tw-h-12 tw-self-end tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-primary tw-text-sm tw-font-semibold tw-text-white tw-px-6 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary disabled:tw-opacity-60"
                    >
                        {issueCertificate.isLoading ? 'Submitting…' : 'Request certificate'}
                    </button>
                </div>
            </div>

            <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-6 tw-mt-6">
                <div className="tw-space-y-4">
                    <header className="tw-flex tw-items-center tw-justify-between">
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Certificates</h3>
                        {certificatesError ? (
                            <button
                                type="button"
                                onClick={() => refetchCertificates()}
                                className="tw-text-xs tw-font-semibold tw-text-red-600"
                            >
                                Retry
                            </button>
                        ) : null}
                    </header>
                    {certificatesLoading ? (
                        <div className="tw-space-y-3">
                            {[...Array(2)].map((_, index) => (
                                <div key={`cert-skeleton-${index}`} className="tw-h-20 tw-bg-gray-100 tw-rounded-xl tw-animate-pulse" />
                            ))}
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="tw-text-sm tw-text-gray-500 tw-bg-gray-50 tw-rounded-xl tw-p-4">
                            No certificates yet. Complete the required sessions and goals, then request one above.
                        </div>
                    ) : (
                        <div className="tw-space-y-4">
                            {certificates.map((certificate) => (
                                <article
                                    key={certificate.id}
                                    className="tw-border tw-border-gray-100 tw-rounded-xl tw-p-4 tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-3"
                                >
                                    <div>
                                        <p className="tw-text-sm tw-font-semibold tw-text-primary">{certificate.programName}</p>
                                        <p className="tw-text-lg tw-font-bold tw-text-gray-900 tw-mt-1">
                                            {certificate.certificateType.charAt(0).toUpperCase() + certificate.certificateType.slice(1)} certificate
                                        </p>
                                        <p className="tw-text-xs tw-text-gray-500">
                                            Issued {formatDate(certificate.issuedAt)} • Serial {certificate.serialNumber}
                                        </p>
                                    </div>
                                    <div className="tw-flex tw-items-center tw-gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDownload(certificate.id)}
                                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-text-sm tw-font-medium tw-text-gray-700 tw-px-4 tw-py-2 hover:tw-bg-gray-50"
                                        >
                                            Download PDF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleReissueRequest(certificate.id)}
                                            disabled={requestReissue.isLoading}
                                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-gray-900 tw-text-white tw-text-sm tw-font-medium tw-px-4 tw-py-2 hover:tw-bg-black/90 disabled:tw-opacity-60"
                                        >
                                            Request reissue
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <div className="tw-space-y-4">
                    <header className="tw-flex tw-items-center tw-justify-between">
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Achievements</h3>
                        {achievementsError ? (
                            <button
                                type="button"
                                onClick={() => refetchAchievements()}
                                className="tw-text-xs tw-font-semibold tw-text-red-600"
                            >
                                Retry
                            </button>
                        ) : null}
                    </header>
                    {achievementsLoading ? (
                        <div className="tw-space-y-3">
                            {[...Array(3)].map((_, index) => (
                                <div key={`ach-skeleton-${index}`} className="tw-h-16 tw-bg-gray-100 tw-rounded-xl tw-animate-pulse" />
                            ))}
                        </div>
                    ) : achievements.length === 0 ? (
                        <div className="tw-text-sm tw-text-gray-500 tw-bg-gray-50 tw-rounded-xl tw-p-4">
                            Achievements will unlock as you hit milestones. Keep attending sessions and completing goals!
                        </div>
                    ) : (
                        <ul className="tw-space-y-3" role="list">
                            {achievements.map((achievement) => {
                                const isUnlocked = achievement.status === 'unlocked';
                                const progressCurrent = achievement.progress?.current ?? 0;
                                const progressTarget = achievement.progress?.target ?? 1;
                                const percentage = Math.min(100, Math.round((progressCurrent / progressTarget) * 100));
                                return (
                                    <li
                                        key={achievement.id}
                                        className={`tw-border tw-rounded-xl tw-p-4 tw-flex tw-flex-col tw-gap-2 ${
                                            isUnlocked ? 'tw-border-emerald-200 tw-bg-emerald-50' : 'tw-border-gray-100'
                                        }`}
                                    >
                                        <div className="tw-flex tw-items-center tw-gap-3">
                                            <span className="tw-text-2xl" aria-hidden="true">
                                                {achievement.icon || '🏅'}
                                            </span>
                                            <div>
                                                <p className="tw-text-sm tw-font-semibold tw-text-gray-900">{achievement.title}</p>
                                                <p className="tw-text-xs tw-text-gray-500">{achievement.description}</p>
                                            </div>
                                        </div>
                                        <div className="tw-text-xs tw-text-gray-500">
                                            {isUnlocked
                                                ? `Unlocked on ${achievement.earnedAt ? new Date(achievement.earnedAt).toLocaleDateString() : '—'}`
                                                : `Progress: ${progressCurrent}/${progressTarget}`}
                                        </div>
                                        {!isUnlocked && (
                                            <progress
                                                className="tw-w-full tw-h-2 tw-rounded-full tw-bg-gray-100 tw-overflow-hidden"
                                                value={percentage}
                                                max={100}
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RecognitionPanel;
