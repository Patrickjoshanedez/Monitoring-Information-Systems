import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ROLE_OPTIONS = [
    {
        id: 'mentee',
        title: 'Mentee',
        blurb: 'Find a mentor, follow a guided learning plan, and track your growth every week.',
        badge: 'Learner-focused',
        accent: 'tw-from-blue-500 tw-to-blue-600'
    },
    {
        id: 'mentor',
        title: 'Mentor',
        blurb: 'Share expertise, coach students, and access tools that make facilitation effortless.',
        badge: 'Share your expertise',
        accent: 'tw-from-green-500 tw-to-green-600'
    },
    {
        id: 'admin',
        title: 'Administrator',
        blurb: 'Coordinate cohorts, review applications, and monitor program outcomes centrally.',
        badge: 'Program oversight',
        accent: 'tw-from-purple-500 tw-to-purple-600'
    }
] as const;

export type RoleSelectionModalProps = {
    open: boolean;
    onClose: () => void;
};

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<typeof ROLE_OPTIONS[number]['id'] | ''>('');

    useEffect(() => {
        if (!open) {
            setSelectedRole('');
        }
    }, [open]);

    if (!open) return null;

    const handleContinue = () => {
        if (!selectedRole) return;
        navigate(`/register?role=${selectedRole}`);
        onClose();
    };

    return (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-px-4">
            <button
                type="button"
                aria-label="Close role selection"
                onClick={onClose}
                className="tw-absolute tw-inset-0 tw-bg-gray-900/40 tw-backdrop-blur-sm"
            />
            <div className="tw-relative tw-w-full tw-max-w-4xl tw-overflow-hidden tw-rounded-3xl tw-bg-white tw-shadow-2xl tw-border tw-border-purple-100">
                <div className="tw-flex tw-flex-col lg:tw-grid lg:tw-grid-cols-[1.1fr_1fr]">
                    <div className="tw-bg-gradient-to-br tw-from-purple-50 tw-via-white tw-to-orange-50 tw-px-8 tw-py-10 lg:tw-px-10">
                        <div className="tw-space-y-4">
                            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-purple-100 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary">
                                Step 1 of 2
                            </span>
                            <h2 className="tw-text-3xl tw-font-bold tw-text-gray-900">
                                Choose how you want to join Mentoring Hub
                            </h2>
                            <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">
                                We tailor onboarding and applications based on your role. Select the path that fits
                                how you intend to participate. You can switch roles later from your profile settings.
                            </p>
                        </div>
                        <div className="tw-mt-8 tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4">
                            {ROLE_OPTIONS.map((role) => {
                                const isSelected = selectedRole === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`tw-relative tw-h-full tw-rounded-2xl tw-border tw-px-5 tw-py-6 tw-text-left tw-transition tw-duration-200 tw-ease-out tw-shadow-sm ${
                                            isSelected
                                                ? 'tw-border-transparent tw-shadow-lg tw-scale-[1.02] tw-bg-gradient-to-br tw-from-white tw-to-purple-50'
                                                : 'tw-border-purple-100 tw-bg-white hover:tw-border-purple-300'
                                        }`}
                                    >
                                        <span
                                            className={`tw-inline-flex tw-items-center tw-rounded-full tw-bg-gradient-to-r ${role.accent} tw-text-white tw-text-[11px] tw-font-semibold tw-px-2.5 tw-py-1`}
                                        >
                                            {role.badge}
                                        </span>
                                        <p className="tw-mt-3 tw-text-lg tw-font-semibold tw-text-gray-900">{role.title}</p>
                                        <p className="tw-mt-2 tw-text-sm tw-text-gray-600">{role.blurb}</p>
                                        {isSelected && (
                                            <span className="tw-absolute tw-top-4 tw-right-4 tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary tw-text-white">
                                                <svg className="tw-h-4 tw-w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <aside className="tw-flex tw-flex-col tw-justify-between tw-bg-white tw-px-8 tw-py-10 lg:tw-px-10">
                        <div className="tw-space-y-5">
                            <div className="tw-space-y-2">
                                <p className="tw-text-sm tw-font-semibold tw-text-primary">What happens next?</p>
                                <ol className="tw-space-y-3">
                                    <li className="tw-flex tw-items-start tw-gap-3">
                                        <span className="tw-mt-0.5 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary/10 tw-text-xs tw-font-semibold tw-text-primary">
                                            1
                                        </span>
                                        <span className="tw-text-sm tw-text-gray-600">
                                            Create your platform account with essential details.
                                        </span>
                                    </li>
                                    <li className="tw-flex tw-items-start tw-gap-3">
                                        <span className="tw-mt-0.5 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary/10 tw-text-xs tw-font-semibold tw-text-primary">
                                            2
                                        </span>
                                        <span className="tw-text-sm tw-text-gray-600">
                                            Complete a short role-specific application so we can tailor your dashboard.
                                        </span>
                                    </li>
                                    <li className="tw-flex tw-items-start tw-gap-3">
                                        <span className="tw-mt-0.5 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary/10 tw-text-xs tw-font-semibold tw-text-primary">
                                            3
                                        </span>
                                        <span className="tw-text-sm tw-text-gray-600">
                                            Get matched and start collaborating once an admin approves your request.
                                        </span>
                                    </li>
                                </ol>
                            </div>
                            <div className="tw-rounded-2xl tw-border tw-border-purple-100 tw-bg-purple-50/60 tw-p-4">
                                <p className="tw-text-xs tw-text-purple-700">
                                    Already part of the program? <button type="button" className="tw-font-semibold tw-text-primary hover:tw-underline" onClick={() => { navigate('/login'); onClose(); }}>Log in</button> to continue your application or join ongoing sessions.
                                </p>
                            </div>
                        </div>
                        <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-between tw-gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="tw-w-full sm:tw-w-auto tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-px-5 tw-py-3 tw-text-sm tw-font-semibold tw-text-gray-600 hover:tw-border-gray-300"
                            >
                                Maybe later
                            </button>
                            <button
                                type="button"
                                onClick={handleContinue}
                                disabled={!selectedRole}
                                className="tw-w-full sm:tw-w-auto tw-rounded-xl tw-bg-primary tw-text-white tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                            >
                                Continue to registration
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default RoleSelectionModal;
