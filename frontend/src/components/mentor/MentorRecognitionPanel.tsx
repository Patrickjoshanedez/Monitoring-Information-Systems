import React, { useMemo, useState } from 'react';
import { useCertificates } from '../../hooks/useCertificates';
import { downloadCertificate, CertificateSummary } from '../../shared/services/certificatesService';
import { useToast } from '../../hooks/useToast';

const formatDate = (value?: string | null) => {
    if (!value) {
        return '—';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }
    return parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'tw-bg-emerald-50', text: 'tw-text-emerald-700', label: 'Active' },
    expired: { bg: 'tw-bg-amber-50', text: 'tw-text-amber-700', label: 'Expired' },
    revoked: { bg: 'tw-bg-red-50', text: 'tw-text-red-700', label: 'Revoked' },
};

const buildVerificationLink = (certificate: CertificateSummary) => {
    if (certificate.verificationUrl) {
        return certificate.verificationUrl;
    }
    const origin = window.location.origin;
    return `${origin}/verify/${certificate.verificationCode}`;
};

const MentorRecognitionPanel: React.FC = () => {
    const { data: certificates = [], isLoading, isError, isFetching, refetch } = useCertificates('mentor');
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();

    const stats = useMemo(() => {
        const total = certificates.length;
        return {
            total,
            active: certificates.filter((item) => item.status === 'active').length,
            expired: certificates.filter((item) => item.status === 'expired').length,
            revoked: certificates.filter((item) => item.status === 'revoked').length,
        };
    }, [certificates]);

    const filteredCertificates = useMemo(() => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) {
            return certificates;
        }
        return certificates.filter((certificate) => {
            const haystack = [
                certificate.menteeName,
                certificate.programName,
                certificate.certificateType,
                certificate.serialNumber,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(needle);
        });
    }, [certificates, searchTerm]);

    const handleDownload = async (certificateId: string) => {
        try {
            await downloadCertificate(certificateId);
            showToast({ message: 'Certificate PDF downloading…', variant: 'success' });
        } catch (error: any) {
            showToast({ message: error?.message || 'Unable to download certificate.', variant: 'error' });
        }
    };

    const handleCopyVerification = async (certificate: CertificateSummary) => {
        try {
            if (!navigator?.clipboard) {
                throw new Error('Clipboard API unavailable');
            }
            const link = buildVerificationLink(certificate);
            await navigator.clipboard.writeText(link);
            showToast({ message: 'Verification link copied to clipboard.', variant: 'success' });
        } catch (error: any) {
            showToast({ message: error?.message || 'Copy failed. Please try again.', variant: 'error' });
        }
    };

    return (
        <section className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-2xl tw-shadow-sm tw-p-6">
            <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-start tw-justify-between tw-gap-6">
                <div className="tw-space-y-2">
                    <p className="tw-text-sm tw-font-semibold tw-text-primary tw-uppercase">Recognition queue</p>
                    <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Certificates you’ve issued</h2>
                    <p className="tw-text-sm tw-text-gray-600">
                        Track which mentees have already received recognition, resend downloads, and quickly share verification links.
                    </p>
                </div>
                <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-4 tw-gap-3">
                    {[
                        { label: 'Total issued', value: stats.total },
                        { label: 'Active', value: stats.active },
                        { label: 'Expired', value: stats.expired },
                        { label: 'Revoked', value: stats.revoked },
                    ].map((item) => (
                        <div key={item.label} className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                            <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">{item.label}</p>
                            <p className="tw-text-xl tw-font-bold tw-text-gray-900">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-mt-6">
                <div className="tw-relative tw-flex-1">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search mentee, program, or serial number"
                        className="tw-w-full tw-px-4 tw-py-2 tw-pr-10 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                        aria-label="Search certificates"
                    />
                    {searchTerm ? (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setSearchTerm('')}
                            className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600"
                        >
                            ×
                        </button>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-4 tw-py-2 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200"
                >
                    Refresh
                    {isFetching ? (
                        <span className="tw-ml-2 tw-inline-flex tw-h-4 tw-w-4 tw-border-2 tw-border-gray-300 tw-border-t-transparent tw-rounded-full tw-animate-spin" aria-hidden="true" />
                    ) : null}
                </button>
            </div>

            {isError ? (
                <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-p-4 tw-text-sm tw-text-red-700 tw-mt-4" role="alert">
                    Unable to load certificates. Please refresh the page.
                </div>
            ) : null}

            {isLoading ? (
                <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mt-6">
                    {[...Array(4)].map((_, index) => (
                        <div key={`certificate-skeleton-${index}`} className="tw-h-32 tw-bg-gray-100 tw-rounded-2xl tw-animate-pulse" />
                    ))}
                </div>
            ) : filteredCertificates.length === 0 ? (
                <div className="tw-mt-6 tw-rounded-2xl tw-border tw-border-dashed tw-border-gray-300 tw-p-8 tw-text-center">
                    <p className="tw-text-base tw-font-semibold tw-text-gray-900">No certificates yet</p>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Once mentees complete their programs, their certificates will appear here for quick follow-up.
                    </p>
                </div>
            ) : (
                <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mt-6">
                    {filteredCertificates.map((certificate) => {
                        const status = statusStyles[certificate.status] || statusStyles.active;
                        const typeLabel = certificate.certificateType && certificate.certificateType.length > 0
                            ? `${certificate.certificateType.charAt(0).toUpperCase()}${certificate.certificateType.slice(1)}`
                            : 'Certificate';
                        return (
                            <article key={certificate.id} className="tw-border tw-border-gray-100 tw-rounded-2xl tw-p-5 tw-flex tw-flex-col tw-gap-4">
                                <div className="tw-flex tw-justify-between tw-gap-3 tw-items-start">
                                    <div>
                                        <p className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Mentee</p>
                                        <p className="tw-text-lg tw-font-bold tw-text-gray-900">{certificate.menteeName || 'Unassigned'}</p>
                                        {certificate.menteeStudentId ? (
                                            <p className="tw-text-xs tw-text-gray-500">ID {certificate.menteeStudentId}</p>
                                        ) : null}
                                    </div>
                                    <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-rounded-full tw-px-3 tw-py-1 ${status.bg} ${status.text}`}>
                                        <span aria-hidden="true">●</span>
                                        {status.label}
                                    </span>
                                </div>
                                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                                    <div>
                                        <p className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Program</p>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-900">{certificate.programName}</p>
                                        <p className="tw-text-xs tw-text-gray-500">
                                            {typeLabel} certificate
                                        </p>
                                    </div>
                                    <div>
                                        <p className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Issued</p>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-900">{formatDate(certificate.issuedAt)}</p>
                                        <p className="tw-text-xs tw-text-gray-500">Serial {certificate.serialNumber}</p>
                                    </div>
                                </div>
                                <div className="tw-flex tw-flex-wrap tw-gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(certificate.id)}
                                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-4 tw-py-2 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200"
                                    >
                                        Download PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyVerification(certificate)}
                                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-gray-900 tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-black/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-900"
                                    >
                                        Copy verification link
                                    </button>
                                    {certificate.reissueCount ? (
                                        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-blue-50 tw-text-blue-700 tw-text-xs tw-font-semibold tw-px-3 tw-py-1">
                                            Reissued {certificate.reissueCount}×
                                        </span>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default MentorRecognitionPanel;
