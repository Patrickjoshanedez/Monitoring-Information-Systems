import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { getPublicProfile } from '../../shared/services/profileApi';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    (async () => {
      try {
        if (user?.id) {
          const data = await getPublicProfile(user.id);
          setProfile(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout>
      <div className="tw-max-w-3xl tw-mx-auto tw-p-4">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h1 className="tw-text-2xl tw-font-semibold">My Profile</h1>
          <a href="/profile/settings" className="tw-text-purple-600 hover:tw-text-purple-700">Edit settings</a>
        </div>
        {loading ? (
          <div className="tw-flex tw-justify-center tw-items-center tw-h-40">
            <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b-2 tw-border-purple-500" />
          </div>
        ) : (
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4">
              <img src={profile?.profile?.photoUrl || 'https://via.placeholder.com/80x80'} alt="avatar" className="tw-w-20 tw-h-20 tw-rounded-full tw-object-cover" />
              <div>
                <div className="tw-text-lg tw-font-semibold">{profile?.displayName || 'Your Name'}</div>
                <div className="tw-text-gray-500 tw-text-sm">{profile?.profile?.timezone || ''}</div>
              </div>
            </div>
            <div className="tw-space-y-2">
              {profile?.profile?.bio && (
                <p className="tw-text-gray-800">{profile.profile.bio}</p>
              )}
              {profile?.profile?.education && (
                <div className="tw-text-sm tw-text-gray-700">
                  <strong>Education:</strong> {profile.profile.education.program || ''} {profile.profile.education.major ? `- ${profile.profile.education.major}` : ''} {profile.profile.education.yearLevel ? `(${profile.profile.education.yearLevel})` : ''}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
