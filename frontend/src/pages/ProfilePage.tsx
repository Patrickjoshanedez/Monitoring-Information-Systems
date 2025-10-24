import React, { useMemo } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';

type StoredUser = {
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
  applicationStatus?: string;
};

const readUserFromStorage = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const normalizedRole = typeof parsed.role === 'string' ? parsed.role.toLowerCase() : undefined;
      return { ...parsed, role: normalizedRole };
    }
  } catch (error) {
    console.error('Unable to read profile from storage:', error);
  }
  return null;
};

const ProfilePage: React.FC = () => {
  const profile = useMemo(() => readUserFromStorage(), []);

  const heading = profile?.firstname || profile?.lastname
    ? `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim()
    : profile?.email ?? 'Profile';

  return (
    <DashboardLayout>
      <div className="tw-max-w-3xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-10">
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-2xl tw-shadow-sm tw-p-6 tw-space-y-6">
          <header className="tw-space-y-2">
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">{heading}</h1>
            <p className="tw-text-sm tw-text-gray-600">
              Manage your account details and review your participation status in the mentoring platform.
            </p>
          </header>

          {profile ? (
            <dl className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
              <div>
                <dt className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Email</dt>
                <dd className="tw-text-base tw-text-gray-800">{profile.email}</dd>
              </div>
              <div>
                <dt className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Role</dt>
                <dd className="tw-text-base tw-text-gray-800">
                  {profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Application Status</dt>
                <dd className="tw-text-base tw-text-gray-800">
                  {profile.applicationStatus ? profile.applicationStatus.replace('_', ' ') : 'Not submitted'}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="tw-rounded-lg tw-border tw-border-yellow-200 tw-bg-yellow-50 tw-p-4 tw-text-sm tw-text-yellow-800">
              No profile information is available. Please log in again to refresh your account data.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
