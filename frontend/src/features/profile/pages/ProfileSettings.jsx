import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import { getMyProfile, updateMyProfile, uploadPhoto } from '../../../shared/services/profileApi';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../../shared/services/mentorMatching';

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'mentors', label: 'Mentors only' },
  { value: 'private', label: 'Only me' },
];

const REMINDER_OPTIONS = [
  { minutes: 2880, label: '48 hours before' },
  { minutes: 1440, label: '24 hours before' },
  { minutes: 60, label: '1 hour before' },
];

const CHANNEL_CONFIG = [
  {
    key: 'sessionReminders',
    label: 'Session reminders',
    description: 'Remind me before my upcoming mentorship sessions.',
  },
  {
    key: 'matches',
    label: 'Mentor matches & requests',
    description: 'Updates when mentors respond to requests or new matches arrive.',
  },
  {
    key: 'announcements',
    label: 'Announcements & updates',
    description: 'Program-wide announcements and admin updates.',
  },
  {
    key: 'messages',
    label: 'Messages & conversations',
    description: 'Chat messages, shared resources, and follow-up notes.',
  },
];

const cloneNotificationDefaults = () => JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES));

const sanitizeReminderOffsets = (offsets, options = {}) => {
  const { allowEmpty = false } = options;
  const cleaned = Array.from(
    new Set(
      (offsets || [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0 && value <= 10080)
    )
  );

  if (!cleaned.length) {
    if (allowEmpty) {
      return [];
    }
    return [...DEFAULT_NOTIFICATION_PREFERENCES.sessionReminders.offsets];
  }

  cleaned.sort((a, b) => b - a);
  return cleaned;
};

const formatOffsetLabel = (minutes) => {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};

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
  const [notificationPrefs, setNotificationPrefs] = useState(() => cloneNotificationDefaults());
  const [customReminderMinutes, setCustomReminderMinutes] = useState('');
  const customReminderOffsets = notificationPrefs.sessionReminders.offsets
    .filter((value) => !REMINDER_OPTIONS.some((option) => option.minutes === value))
    .sort((a, b) => b - a);

  useEffect(() => {
    (async () => {
      try {
        const [me, preferences] = await Promise.all([
          getMyProfile(),
          getNotificationPreferences().catch(() => cloneNotificationDefaults()),
        ]);
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
        if (preferences) {
          setNotificationPrefs(preferences);
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleReminderOffset = (minutes) => {
    setNotificationPrefs((prev) => {
      const isSelected = prev.sessionReminders.offsets.includes(minutes);
      const nextOffsets = isSelected
        ? prev.sessionReminders.offsets.filter((value) => value !== minutes)
        : [...prev.sessionReminders.offsets, minutes];
      return {
        ...prev,
        sessionReminders: {
          ...prev.sessionReminders,
          offsets: sanitizeReminderOffsets(nextOffsets, { allowEmpty: true }),
        },
      };
    });
  };

  const handleAddCustomReminder = () => {
    const minutes = Number(customReminderMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError('Custom reminder must be a positive number of minutes.');
      return;
    }
    if (minutes > 10080) {
      setError('Custom reminder cannot exceed 7 days (10080 minutes).');
      return;
    }
    setError('');
    setNotificationPrefs((prev) => ({
      ...prev,
      sessionReminders: {
        ...prev.sessionReminders,
        offsets: sanitizeReminderOffsets([...prev.sessionReminders.offsets, minutes], { allowEmpty: true }),
      },
    }));
    setCustomReminderMinutes('');
  };

  const handleRemoveReminder = (minutes) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      sessionReminders: {
        ...prev.sessionReminders,
        offsets: sanitizeReminderOffsets(
          prev.sessionReminders.offsets.filter((value) => value !== minutes),
          { allowEmpty: true }
        ),
      },
    }));
  };

  const updateChannelPreference = (key, channel, value) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [key]: {
          ...prev.channels[key],
          [channel]: value,
        },
      },
    }));
  };

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
      const offsets = sanitizeReminderOffsets(notificationPrefs.sessionReminders.offsets);
      const preferencesPayload = {
        channels: notificationPrefs.channels,
        sessionReminders: {
          enabled: notificationPrefs.sessionReminders.enabled,
          offsets,
        },
      };
      const updatedPreferences = await updateNotificationPreferences(preferencesPayload);
      setNotificationPrefs(updatedPreferences);
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

            {/* Notification Preferences */}
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-space-y-6">
              <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-2">
                <div>
                  <h2 className="tw-text-base tw-font-semibold tw-text-gray-900">Notification preferences</h2>
                  <p className="tw-text-sm tw-text-gray-500">Choose how you receive reminders and alerts.</p>
                </div>
              </div>

              <section className="tw-border tw-border-gray-100 tw-rounded-lg tw-p-4 tw-space-y-4" aria-labelledby="session-reminders-heading">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
                  <div>
                    <h3 id="session-reminders-heading" className="tw-text-sm tw-font-semibold tw-text-gray-900">Session reminders</h3>
                    <p className="tw-text-sm tw-text-gray-500">We will notify you ahead of each confirmed session.</p>
                  </div>
                  <label className="tw-inline-flex tw-items-center tw-gap-2">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.sessionReminders.enabled}
                      onChange={(e) =>
                        setNotificationPrefs((prev) => ({
                          ...prev,
                          sessionReminders: { ...prev.sessionReminders, enabled: e.target.checked },
                        }))
                      }
                    />
                    <span className="tw-text-sm tw-text-gray-700">Enable</span>
                  </label>
                </div>

                <div className="tw-space-y-4">
                  <div>
                    <span className="tw-text-sm tw-font-medium tw-text-gray-700">Remind me</span>
                    <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mt-2">
                      {REMINDER_OPTIONS.map((option) => {
                        const isSelected = notificationPrefs.sessionReminders.offsets.includes(option.minutes);
                        return (
                          <label
                            key={option.minutes}
                            className={`tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-sm tw-font-medium ${isSelected ? 'tw-border-purple-500 tw-bg-purple-50 tw-text-purple-700' : 'tw-border-gray-200 tw-text-gray-600'}`}
                          >
                            <input
                              type="checkbox"
                              className="tw-hidden"
                              checked={isSelected}
                              onChange={() => toggleReminderOffset(option.minutes)}
                              disabled={!notificationPrefs.sessionReminders.enabled}
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="custom-reminder-minutes" className="tw-text-sm tw-font-medium tw-text-gray-700">Add custom reminder (minutes)</label>
                    <div className="tw-flex tw-items-center tw-gap-2 tw-mt-2">
                      <input
                        id="custom-reminder-minutes"
                        type="number"
                        min="1"
                        max="10080"
                        value={customReminderMinutes}
                        onChange={(e) => setCustomReminderMinutes(e.target.value)}
                        disabled={!notificationPrefs.sessionReminders.enabled}
                        className="tw-w-32 tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm"
                        placeholder="e.g., 30"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomReminder}
                        disabled={!notificationPrefs.sessionReminders.enabled || !customReminderMinutes.trim()}
                        className="tw-inline-flex tw-items-center tw-rounded-lg tw-bg-purple-600 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-white hover:tw-bg-purple-700 disabled:tw-cursor-not-allowed disabled:tw-bg-purple-300"
                      >
                        Add
                      </button>
                    </div>
                    {customReminderOffsets.length > 0 && (
                      <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-3" aria-live="polite">
                        {customReminderOffsets.map((minutes) => (
                          <span key={minutes} className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-gray-100 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-gray-700">
                            {formatOffsetLabel(minutes)}
                            <button
                              type="button"
                              onClick={() => handleRemoveReminder(minutes)}
                              className="tw-text-gray-500 hover:tw-text-gray-700"
                              aria-label={`Remove ${formatOffsetLabel(minutes)} reminder`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="tw-space-y-4" aria-labelledby="channel-preferences-heading">
                <div>
                  <h3 id="channel-preferences-heading" className="tw-text-sm tw-font-semibold tw-text-gray-900">Alert channels</h3>
                  <p className="tw-text-sm tw-text-gray-500">Select how you want to receive different alerts.</p>
                </div>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                  {CHANNEL_CONFIG.map((channel) => (
                    <div key={channel.key} className="tw-border tw-border-gray-100 tw-rounded-lg tw-p-4 tw-space-y-3">
                      <div>
                        <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">{channel.label}</h4>
                        <p className="tw-text-sm tw-text-gray-500">{channel.description}</p>
                      </div>
                      <div className="tw-flex tw-gap-4 tw-flex-wrap">
                        {['inApp', 'email'].map((medium) => (
                          <label key={medium} className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.channels[channel.key][medium]}
                              onChange={(e) => updateChannelPreference(channel.key, medium, e.target.checked)}
                            />
                            <span>{medium === 'inApp' ? 'In-app' : 'Email'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

          <div className="tw-flex tw-justify-end">
            <button className="tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-lg tw-px-4 tw-py-2 tw-font-medium">Save changes</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
