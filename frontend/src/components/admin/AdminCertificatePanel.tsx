import React, { FormEvent, useMemo, useState } from 'react';
import { useCertificates, useIssueCertificate } from '../../hooks/useCertificates';
import { useApprovedMentees, useApprovedMentors } from '../../features/admin/hooks/useCertificateDirectory';
import { AdminDirectoryUser } from '../../features/admin/services/certificateAdminApi';
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

const filterDirectory = (items: AdminDirectoryUser[] = [], query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
        return items;
    }
    return items.filter((item) => {
        const haystack = [item.name, item.email, item.focus, item.metadata]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return haystack.includes(normalized);
    });
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

type CertificateFormState = {
    menteeId: string;
    mentorId: string;
    programName: string;
    cohort: string;
    certificateType: NonNullable<IssueCertificatePayload['certificateType']>;
    statement: string;
};

const AdminCertificatePanel: React.FC = () => {
    const [form, setForm] = useState<CertificateFormState>({
        menteeId: '',
        mentorId: '',
        programName: 'Mentorship Program',
        cohort: '',
        certificateType: 'completion',
        statement: '',
    });
    const [menteeSearch, setMenteeSearch] = useState('');
    const [mentorSearch, setMentorSearch] = useState('');
    const { data: mentees = [], isLoading: menteesLoading, isError: menteesError, refetch: refetchMentees } = useApprovedMentees();
    const { data: mentors = [], isLoading: mentorsLoading, isError: mentorsError, refetch: refetchMentors } = useApprovedMentors();
    const { data: certificates = [], isLoading: certificatesLoading, isError: certificatesError, refetch: refetchCertificates } = useCertificates('admin');
    const issueCertificate = useIssueCertificate('admin');
    const { showToast } = useToast();

    const filteredMentees = useMemo(() => filterDirectory(mentees, menteeSearch), [mentees, menteeSearch]);
    const filteredMentors = useMemo(() => filterDirectory(mentors, mentorSearch), [mentors, mentorSearch]);
    const selectedMentee = useMemo(() => mentees.find((entry) => entry.id === form.menteeId), [mentees, form.menteeId]);
    const selectedMentor = useMemo(() => mentors.find((entry) => entry.id === form.mentorId), [mentors, form.mentorId]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!form.menteeId) {
            showToast({ message: 'Select a mentee to issue a certificate.', variant: 'error' });
            return;
        }
        if (!form.programName.trim()) {
            showToast({ message: 'Program name is required.', variant: 'error' });
            return;
        }
        try {
            await issueCertificate.mutateAsync({
                programName: form.programName.trim(),
                certificateType: form.certificateType,
                cohort: form.cohort.trim() || undefined,
                mentorId: form.mentorId || undefined,
                menteeId: form.menteeId,
                statement: form.statement.trim() || undefined,
            });
            showToast({ message: 'Certificate generated successfully.', variant: 'success' });
            setForm((prev) => ({ ...prev, cohort: '', statement: '' }));
        } catch (error: any) {
            showToast({ message: error?.message || 'Unable to issue certificate.', variant: 'error' });
        }
    };

    const handleDownload = async (certificateId: string) => {
        try {
            await downloadCertificate(certificateId);
            showToast({ message: 'Downloading certificate…', variant: 'info' });
        } catch (error: any) {
            showToast({ message: error?.message || 'Unable to download PDF.', variant: 'error' });
        }
    };

    const renderDirectoryList = (items: AdminDirectoryUser[], selectedId: string, onSelect: (value: string) => void) => {
        if (!items.length) {
            return <p className="tw-text-sm tw-text-gray-500">No entries found. Adjust the search filter.</p>;
        }
        return (
            <ul className="tw-max-h-60 tw-overflow-y-auto tw-divide-y tw-divide-gray-100" role="list">
                {items.map((item) => (
                    <li key={item.id}>
                        <button
                            type="button"
                            className={`tw-w-full tw-text-left tw-py-3 tw-px-3 tw-rounded-lg tw-transition-colors ${
                                selectedId === item.id
                                    ? 'tw-bg-purple-50 tw-border tw-border-purple-200'
                                    : 'hover:tw-bg-gray-50'
                            }`}
                            onClick={() => onSelect(item.id)}
                        >
                            <p className="tw-text-sm tw-font-semibold tw-text-gray-900">{item.name}</p>
                            <p className="tw-text-xs tw-text-gray-500">{item.email}</p>
                            {item.focus && <p className="tw-text-xs tw-text-gray-400">{item.focus}</p>}
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <section className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-6 tw-space-y-8">
            <header className="tw-space-y-1">
                <p className="tw-text-xs tw-font-semibold tw-text-purple-600 tw-uppercase">Certificates</p>
                <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Issue certificates on behalf of mentees</h2>
                <p className="tw-text-sm tw-text-gray-600">
                    Admins can generate the same landscape PDF used for mentees, with the ability to override recipients, cohorts, and statements.
                </p>
            </header>

            <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
                <form onSubmit={handleSubmit} className="tw-col-span-2 tw-space-y-6" aria-label="Certificate creation form">
                    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
                        <div>
                            <label htmlFor="menteeSearch" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Search approved mentees
                            </label>
                            <input
                                id="menteeSearch"
                                type="text"
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                value={menteeSearch}
                                onChange={(event) => setMenteeSearch(event.target.value)}
                                placeholder="Search by name, email, or major"
                            />
                            <div className="tw-mt-3 tw-border tw-border-gray-100 tw-rounded-lg tw-p-3 tw-bg-gray-50">
                                {menteesLoading ? (
                                    <p className="tw-text-sm tw-text-gray-500">Loading mentees…</p>
                                ) : menteesError ? (
                                    <button
                                        type="button"
                                        onClick={() => refetchMentees()}
                                        className="tw-text-sm tw-text-red-600"
                                    >
                                        Retry loading mentees
                                    </button>
                                ) : (
                                    renderDirectoryList(filteredMentees, form.menteeId, (id) => setForm((prev) => ({ ...prev, menteeId: id })))
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="mentorSearch" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Optional mentor signer
                            </label>
                            <input
                                id="mentorSearch"
                                type="text"
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                value={mentorSearch}
                                onChange={(event) => setMentorSearch(event.target.value)}
                                placeholder="Select a mentor to sign the certificate"
                            />
                            <div className="tw-mt-3 tw-border tw-border-gray-100 tw-rounded-lg tw-p-3 tw-bg-gray-50">
                                {mentorsLoading ? (
                                    <p className="tw-text-sm tw-text-gray-500">Loading mentors…</p>
                                ) : mentorsError ? (
                                    <button
                                        type="button"
                                        onClick={() => refetchMentors()}
                                        className="tw-text-sm tw-text-red-600"
                                    >
                                        Retry loading mentors
                                    </button>
                                ) : (
                                    renderDirectoryList(filteredMentors, form.mentorId, (id) => setForm((prev) => ({ ...prev, mentorId: prev.mentorId === id ? '' : id })))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
                        <div>
                            <label htmlFor="programName" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Program name
                            </label>
                            <input
                                id="programName"
                                type="text"
                                value={form.programName}
                                onChange={(event) => setForm((prev) => ({ ...prev, programName: event.target.value }))}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                placeholder="Mentoring Mastery Cohort"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="cohort" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Cohort (optional)
                            </label>
                            <input
                                id="cohort"
                                type="text"
                                value={form.cohort}
                                onChange={(event) => setForm((prev) => ({ ...prev, cohort: event.target.value }))}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                placeholder="2024 Alpha"
                            />
                        </div>
                    </div>

                    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
                        <div>
                            <label htmlFor="certificateType" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Certificate type
                            </label>
                            <select
                                id="certificateType"
                                value={form.certificateType}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        certificateType: event.target.value as CertificateFormState['certificateType'],
                                    }))
                                }
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                            >
                                <option value="completion">Completion</option>
                                <option value="participation">Participation</option>
                                <option value="excellence">Excellence</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="statement" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                Highlight statement (optional)
                            </label>
                            <textarea
                                id="statement"
                                value={form.statement}
                                onChange={(event) => setForm((prev) => ({ ...prev, statement: event.target.value }))}
                                className="tw-mt-1 tw-h-24 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-500"
                                placeholder="Recognized for outstanding mentorship participation."
                            />
                        </div>
                    </div>

                    <div className="tw-flex tw-justify-end">
                        <button
                            type="submit"
                            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-purple-600 tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-purple-500 disabled:tw-opacity-60"
                            disabled={issueCertificate.isLoading}
                        >
                            {issueCertificate.isLoading ? 'Issuing certificate…' : 'Generate certificate'}
                        </button>
                    </div>
                </form>

                <aside className="tw-bg-gradient-to-br tw-from-purple-600 tw-to-slate-900 tw-rounded-2xl tw-p-6 tw-text-white tw-space-y-4" aria-live="polite">
                    <p className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide">Live preview</p>
                    <h3 className="tw-text-2xl tw-font-bold">
                        Certificate of {form.certificateType ? capitalize(form.certificateType) : 'Completion'}
                    </h3>
                    <div className="tw-bg-white/10 tw-rounded-xl tw-p-4">
                        <p className="tw-text-xs tw-uppercase tw-text-white/80">Awarded to</p>
                        <p className="tw-text-xl tw-font-semibold tw-text-white">
                            {selectedMentee?.name || 'Select a mentee'}
                        </p>
                        <p className="tw-text-sm tw-text-white/80">{selectedMentee?.focus || 'Awaiting program details'}</p>
                    </div>
                    <div className="tw-space-y-1">
                        <p className="tw-text-sm tw-font-medium">Program</p>
                        <p className="tw-text-base tw-font-semibold">{form.programName || 'Program TBD'}</p>
                        <p className="tw-text-xs tw-text-white/70">{form.cohort || 'No cohort specified'}</p>
                    </div>
                    <div className="tw-space-y-1">
                        <p className="tw-text-sm tw-font-medium">Mentor signer</p>
                        <p className="tw-text-base tw-font-semibold">{selectedMentor?.name || 'Auto-selected mentor'}</p>
                        <p className="tw-text-xs tw-text-white/70">{selectedMentor?.focus || 'Mentor roster'}</p>
                    </div>
                    <p className="tw-text-sm tw-leading-6">
                        {form.statement || 'Add a statement above to highlight achievements. Statistics and QR codes are embedded automatically in the PDF to keep the layout stylish and landscape-ready.'}
                    </p>
                </aside>
            </div>

            <div className="tw-space-y-3">
                <div className="tw-flex tw-items-center tw-justify-between">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Recently issued certificates</h3>
                    {certificatesError && (
                        <button type="button" onClick={() => refetchCertificates()} className="tw-text-sm tw-text-red-600">
                            Retry
                        </button>
                    )}
                </div>
                {certificatesLoading ? (
                    <div className="tw-space-y-3">
                        {[...Array(3)].map((_, index) => (
                            <div key={`cert-skeleton-${index}`} className="tw-h-16 tw-rounded-xl tw-bg-gray-100 tw-animate-pulse" />
                        ))}
                    </div>
                ) : certificates.length === 0 ? (
                    <p className="tw-text-sm tw-text-gray-500">No certificates have been issued by admins yet.</p>
                ) : (
                    <div className="tw-overflow-x-auto">
                        <table className="tw-min-w-full tw-text-sm">
                            <thead>
                                <tr className="tw-text-left tw-text-gray-500">
                                    <th className="tw-py-2 tw-pr-4">Mentee</th>
                                    <th className="tw-py-2 tw-pr-4">Program</th>
                                    <th className="tw-py-2 tw-pr-4">Type</th>
                                    <th className="tw-py-2 tw-pr-4">Issued</th>
                                    <th className="tw-py-2 tw-pr-4">Serial</th>
                                    <th className="tw-py-2" aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody className="tw-divide-y tw-divide-gray-100">
                                {certificates.map((certificate) => (
                                    <tr key={certificate.id}>
                                        <td className="tw-py-3 tw-pr-4">
                                            <p className="tw-font-medium tw-text-gray-900">{certificate.menteeName || '—'}</p>
                                            <p className="tw-text-xs tw-text-gray-500">{certificate.menteeStudentId || certificate.menteeId || 'ID pending'}</p>
                                        </td>
                                        <td className="tw-py-3 tw-pr-4">
                                            <p className="tw-text-gray-900">{certificate.programName}</p>
                                            {certificate.cohort && <p className="tw-text-xs tw-text-gray-500">{certificate.cohort}</p>}
                                        </td>
                                        <td className="tw-py-3 tw-pr-4">{capitalize(certificate.certificateType || 'completion')}</td>
                                        <td className="tw-py-3 tw-pr-4">{formatDate(certificate.issuedAt)}</td>
                                        <td className="tw-py-3 tw-pr-4">{certificate.serialNumber}</td>
                                        <td className="tw-py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(certificate.id)}
                                                className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-700 hover:tw-bg-gray-50"
                                            >
                                                Download PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AdminCertificatePanel;
