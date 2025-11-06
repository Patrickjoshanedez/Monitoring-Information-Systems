import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import { getMyProfile, updateMyProfile, uploadPhoto } from '../../../shared/services/profileApi';

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'mentors', label: 'Mentors only' },
  { value: 'private', label: 'Only me' },
];

const PrivacySelect = ({ label, value, onChange }) => (
  <div className="tw-flex tw-items-center tw-gap-3">
    <span className="tw-text-sm tw-text-gray-600">{label}</span>
    <select className="tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm tw-px-2 tw-py-1" value={value} onChange={(e) => onChange(e.target.value)}>
      {PRIVACY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

const ChipInput = ({ label, values, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const addChip = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...(values || []), v]);
    setInput('');
  };
  const removeChip = (idx) => {
    const next = [...(values || [])];
    next.splice(idx, 1);
    onChange(next);
  };
  return (
    <div>
      <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">{label}</label>
      <div className="tw-flex tw-flex-wrap tw-gap-2 tw-border tw-border-gray-300 tw-rounded-lg tw-p-2">
        {(values || []).map((v, i) => (
          <span key={`${v}-${i}`} className="tw-inline-flex tw-items-center tw-bg-purple-100 tw-text-purple-700 tw-rounded-full tw-px-2 tw-py-1 tw-text-xs">
            {v}
            <button type="button" className="tw-ml-1 tw-text-purple-600 hover:tw-text-purple-800" onClick={() => removeChip(i)}>×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChip(); } }}
          placeholder={placeholder}
          className="tw-flex-1 tw-min-w-[160px] tw-outline-none"
        />
        <button type="button" onClick={addChip} className="tw-text-sm tw-text-purple-600 hover:tw-text-purple-700">Add</button>
      </div>
    </div>
  );
};

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    displayName: '',
    photoUrl: '',
    bio: '',
    education: { program: '', yearLevel: '', major: '' },
    coursesNeeded: [],
    interests: [],
    learningGoals: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    contactPreferences: ['in_app'],
    privacy: {
      displayName: 'public', photo: 'public', bio: 'mentors', education: 'mentors', interests: 'mentors', learningGoals: 'mentors', coursesNeeded: 'mentors', contact: 'private'
    }
  });

  useEffect(() => {
    (async () => {
      try {
        const me = await getMyProfile();
        const prof = me?.profile || {};
        setForm((prev) => ({
          ...prev,
          ...prof,
          education: { ...(prev.education || {}), ...(prof.education || {}) },
          coursesNeeded: prof.coursesNeeded || [],
          interests: prof.interests || [],
          contactPreferences: prof.contactPreferences || ['in_app'],
          privacy: { ...prev.privacy, ...(prof.privacy || {}) }
        }));
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpload = async (file) => {
    setError('');
    try {
      const { photoUrl } = await uploadPhoto(file);
      setForm((f) => ({ ...f, photoUrl }));
      setSuccess('Photo updated');
      setTimeout(() => setSuccess(''), 2000);
    } catch (_e) {
      setError(_e?.response?.data?.message || 'Failed to upload photo');
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        displayName: form.displayName,
        photoUrl: form.photoUrl,
        bio: form.bio,
        education: form.education,
        coursesNeeded: form.coursesNeeded,
        interests: form.interests,
        learningGoals: form.learningGoals,
        timezone: form.timezone,
        contactPreferences: form.contactPreferences,
        privacy: form.privacy,
      };
      await updateMyProfile(payload);
      setSuccess('Profile saved');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save profile');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="tw-min-h-screen tw-flex tw-items-center tw-justify-center">
          <div className="tw-animate-spin tw-rounded-full tw-h-10 tw-w-10 tw-border-b-2 tw-border-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="tw-max-w-4xl tw-mx-auto tw-p-4">
        <h1 className="tw-text-2xl tw-font-semibold tw-mb-4">Profile settings</h1>

        {error && <div className="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-700 tw-p-3 tw-rounded">{error}</div>}
        {success && <div className="tw-mb-4 tw-bg-green-50 tw-border tw-border-green-200 tw-text-green-700 tw-p-3 tw-rounded">{success}</div>}

        <form onSubmit={onSave} className="tw-space-y-6">
          {/* Avatar & Display name */}
          <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
              <img src={form.photoUrl || 'https://via.placeholder.com/96x96'} alt="avatar" className="tw-w-24 tw-h-24 tw-rounded-full tw-object-cover tw-border tw-border-gray-200" />
              <div className="tw-space-y-2">
                <button type="button" className="tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-lg tw-px-3 tw-py-2" onClick={() => fileRef.current?.click()}>Upload Photo</button>
                <input type="file" ref={fileRef} accept="image/*" className="tw-hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Display name</label>
                  <input className="tw-mt-1 tw-w-64 tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2" value={form.displayName || ''} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                </div>
                <PrivacySelect label="Visibility" value={form.privacy?.displayName || 'public'} onChange={(v) => setForm({ ...form, privacy: { ...form.privacy, displayName: v } })} />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-2">
            <div className="tw-flex tw-justify-between tw-items-center">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">Bio</label>
              <PrivacySelect label="Visibility" value={form.privacy?.bio || 'mentors'} onChange={(v) => setForm({ ...form, privacy: { ...form.privacy, bio: v } })} />
            </div>
            <textarea className="tw-w-full tw-min-h-[96px] tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2" value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>

          {/* Education */}
          <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-2">
            <div className="tw-flex tw-justify-between tw-items-center">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">Education</label>
              <PrivacySelect label="Visibility" value={form.privacy?.education || 'mentors'} onChange={(v) => setForm({ ...form, privacy: { ...form.privacy, education: v } })} />
            </div>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3">
              <input className="tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2" placeholder="Program" value={form.education?.program || ''} onChange={(e) => setForm({ ...form, education: { ...form.education, program: e.target.value } })} />
              <input className="tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2" placeholder="Year level" value={form.education?.yearLevel || ''} onChange={(e) => setForm({ ...form, education: { ...form.education, yearLevel: e.target.value } })} />
              <input className="tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2" placeholder="Major" value={form.education?.major || ''} onChange={(e) => setForm({ ...form, education: { ...form.education, major: e.target.value } })} />
            </div>
          </div>

          {/* Courses Needed */}
          <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-2">
            <div className="tw-flex tw-justify-between tw-items-center">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">Courses I need help with</label>
              <PrivacySelect label="Visibility" value={form.privacy?.coursesNeeded || 'mentors'} onChange={(v) => setForm({ ...form, privacy: { ...form.privacy, coursesNeeded: v } })} />
            </div>
            <ChipInput label="Add course" values={form.coursesNeeded || []} onChange={(vals) => setForm({ ...form, coursesNeeded: vals })} placeholder="e.g., Data Structures" />
          </div>

          {/* Interests */}
          <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-2">
            <div className="tw-flex tw-justify-between tw-items-center">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">Interests</label>
              <PrivacySelect label="Visibility" value={form.privacy?.interests || 'mentors'} onChange={(v) => setForm({ ...form, privacy: { ...form.privacy, interests: v } })} />
            </div>
            <ChipInput label="Add interest" values={form.interests || []} onChange={(vals) => setForm({ ...form, interests: vals })} placeholder="e.g., Web Development" />
          </div>

          {/* Learning Goals */}
          <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-2">
            <div className="tw-flex tw-justify-between tw-items-center">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">Learning goals</label>
              <PrivacySelect label="Visibility" value={form.privacy?.learningGoals || 'mentors'} onChange={(v) => setForm({ ...form, privacy: { ...form.privacy, learningGoals: v } })} />
            </div>
            <textarea className="tw-w-full tw-min-h-[80px] tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2" value={form.learningGoals || ''} onChange={(e) => setForm({ ...form, learningGoals: e.target.value })} />
          </div>

          {/* Timezone & Contact */}
          <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Timezone</label>
              <input className="tw-mt-1 tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2" value={form.timezone || ''} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            </div>
            <div>
              <div className="tw-flex tw-items-center tw-justify-between">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">Contact preferences</label>
                <PrivacySelect label="Visibility" value={form.privacy?.contact || 'private'} onChange={(v) => setForm({ ...form, privacy: { ...form.privacy, contact: v } })} />
              </div>
              <div className="tw-flex tw-gap-4 tw-mt-2">
                {['in_app', 'email', 'sms'].map((opt) => (
                  <label key={opt} className="tw-inline-flex tw-items-center tw-gap-2">
                    <input type="checkbox" checked={(form.contactPreferences || []).includes(opt)} onChange={(e) => {
                      const set = new Set(form.contactPreferences || []);
                      if (e.target.checked) set.add(opt); else set.delete(opt);
                      setForm({ ...form, contactPreferences: Array.from(set) });
                    }} />
                    <span className="tw-text-sm tw-text-gray-700">{opt === 'in_app' ? 'In-app' : opt.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="tw-flex tw-justify-end">
            <button className="tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-lg tw-px-4 tw-py-2 tw-font-medium">Save changes</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
