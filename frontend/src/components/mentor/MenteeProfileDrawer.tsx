import React, { useEffect, useState } from 'react';
import { getPublicProfile } from '../../shared/services/profileApi';

type Props = {
  open: boolean;
  onClose: () => void;
  menteeId: string | null;
};

const Skeleton: React.FC = () => (
  <div className="tw-space-y-3">
    <div className="tw-h-6 tw-bg-gray-200 tw-rounded tw-w-1/3" />
    <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-full" />
    <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-5/6" />
  </div>
);

const MenteeProfileDrawer: React.FC<Props> = ({ open, onClose, menteeId }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !menteeId) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    setProfile(null);
    getPublicProfile(menteeId)
      .then((res) => {
        if (!mounted) return;
        setProfile(res.profile || res);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load profile');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [open, menteeId]);

  if (!open) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex">
      <div className="tw-flex-1" onClick={onClose} />
      <aside className="tw-w-96 tw-bg-white tw-shadow-xl tw-p-6 tw-overflow-y-auto">
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold">Mentee profile</h3>
          <button onClick={onClose} className="tw-text-gray-500 hover:tw-text-gray-700">Close</button>
        </div>

        {loading && <Skeleton />}

        {error && <div className="tw-text-red-600">{error}</div>}

        {!loading && profile && (
          <div className="tw-space-y-3">
            <div className="tw-text-sm tw-text-gray-600">{profile.displayName || profile.name || '—'}</div>
            {profile.photoUrl && (
              <img src={profile.photoUrl} alt="avatar" className="tw-w-24 tw-h-24 tw-rounded-full tw-object-cover tw-mb-2" />
            )}

            {profile.bio && (
              <div>
                <h4 className="tw-font-medium">About</h4>
                <p className="tw-text-sm tw-text-gray-700">{profile.bio}</p>
              </div>
            )}

            {profile.education && (
              <div>
                <h4 className="tw-font-medium">Education</h4>
                <p className="tw-text-sm tw-text-gray-700">{profile.education.program || ''} {profile.education.yearLevel ? `• ${profile.education.yearLevel}` : ''}</p>
              </div>
            )}

            {Array.isArray(profile.interests) && profile.interests.length > 0 && (
              <div>
                <h4 className="tw-font-medium">Interests</h4>
                <div className="tw-flex tw-gap-2 tw-flex-wrap">
                  {profile.interests.map((i: string) => (
                    <span key={i} className="tw-text-xs tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded">{i}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.learningGoals && (
              <div>
                <h4 className="tw-font-medium">Learning goals</h4>
                <p className="tw-text-sm tw-text-gray-700">{profile.learningGoals}</p>
              </div>
            )}

            <div className="tw-text-xs tw-text-gray-500">Privacy: fields shown follow user's privacy settings.</div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default MenteeProfileDrawer;
