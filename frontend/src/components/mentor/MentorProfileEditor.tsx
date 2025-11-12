import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import { useMyProfile, useUpdateMentorProfile, useUploadProfilePhoto } from '../../shared/hooks/useMentorProfile';

// Simple availability row editor type
interface AvailabilitySlot { day: string; start: string; end: string; }
const DAYS: { code: string; label: string }[] = [
  { code: 'mon', label: 'Mon' },
  { code: 'tue', label: 'Tue' },
  { code: 'wed', label: 'Wed' },
  { code: 'thu', label: 'Thu' },
  { code: 'fri', label: 'Fri' },
  { code: 'sat', label: 'Sat' },
  { code: 'sun', label: 'Sun' },
];

const emptySlot = (): AvailabilitySlot => ({ day: 'mon', start: '09:00', end: '10:00' });

// Small reusable chip input
const ChipInput: React.FC<{ label: string; values: string[]; onChange: (next: string[]) => void; placeholder?: string }> = ({ label, values, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  const remove = (i: number) => {
    const next = [...values];
    next.splice(i, 1);
    onChange(next);
  };
  return (
    <div className="tw-space-y-1">
      <label className="tw-text-sm tw-font-medium tw-text-gray-700">{label}</label>
      <div className="tw-flex tw-flex-wrap tw-gap-2 tw-border tw-border-gray-300 tw-rounded-lg tw-p-2">
        {values.map((v, i) => (
          <span key={v+i} className="tw-inline-flex tw-items-center tw-bg-purple-100 tw-text-purple-700 tw-rounded-full tw-px-2 tw-py-1 tw-text-xs">
            {v}
            <button type="button" onClick={() => remove(i)} className="tw-ml-1 tw-font-semibold hover:tw-text-purple-900" aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder || `Add ${label}`}
          title={label}
          className="tw-flex-1 tw-min-w-[140px] tw-outline-none tw-text-sm"
          aria-label={label}
        />
        <button type="button" onClick={add} className="tw-text-sm tw-text-purple-600 hover:tw-text-purple-700">Add</button>
      </div>
    </div>
  );
};

// Availability table editor
const AvailabilityEditor: React.FC<{ slots: AvailabilitySlot[]; onChange: (next: AvailabilitySlot[]) => void }> = ({ slots, onChange }) => {
  const update = (i: number, patch: Partial<AvailabilitySlot>) => {
    const next = [...slots];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const addSlot = () => onChange([...slots, emptySlot()]);
  const removeSlot = (i: number) => {
    const next = [...slots];
    next.splice(i, 1);
    onChange(next);
  };
  return (
    <div className="tw-space-y-2">
      <div className="tw-flex tw-items-center tw-justify-between">
        <label className="tw-text-sm tw-font-medium tw-text-gray-700">Availability</label>
        <button type="button" onClick={addSlot} className="tw-text-xs tw-font-medium tw-text-blue-600 hover:tw-text-blue-700">Add slot</button>
      </div>
      {slots.length === 0 && <div className="tw-text-xs tw-text-gray-500">No slots added yet.</div>}
      <div className="tw-space-y-2">
        {slots.map((slot, i) => (
          <div key={i} className="tw-grid tw-grid-cols-12 tw-gap-2 tw-items-end">
            <div className="tw-col-span-3">
              <select
                value={slot.day}
                onChange={(e) => update(i, { day: e.target.value })}
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500"
                aria-label={`Day for slot ${i+1}`}
                title="Day"
              >
                {DAYS.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            </div>
            <div className="tw-col-span-3">
              <input
                type="time"
                value={slot.start}
                onChange={(e) => update(i, { start: e.target.value })}
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500"
                aria-label={`Start time for slot ${i+1}`}
                title="Start time"
              />
            </div>
            <div className="tw-col-span-3">
              <input
                type="time"
                value={slot.end}
                onChange={(e) => update(i, { end: e.target.value })}
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500"
                aria-label={`End time for slot ${i+1}`}
                title="End time"
              />
            </div>
            <div className="tw-col-span-2 tw-flex tw-items-center tw-gap-2">
              <button type="button" onClick={() => removeSlot(i)} className="tw-text-xs tw-text-red-600 hover:tw-text-red-700">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MentorProfileEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: me, isLoading } = useMyProfile();

  const [form, setForm] = useState({
    displayName: '',
    photoUrl: '',
    bio: '',
    expertiseAreas: [] as string[],
    skills: [] as string[],
    availabilitySlots: [] as AvailabilitySlot[],
  });

  useEffect(() => {
    if (me) {
      const prof: any = me.profile || {};
      setForm(f => ({
        ...f,
        displayName: prof.displayName || '',
        photoUrl: prof.photoUrl || '',
        bio: prof.bio || '',
        expertiseAreas: Array.isArray(prof.expertiseAreas) ? prof.expertiseAreas : [],
        skills: Array.isArray(prof.skills) ? prof.skills : [],
        availabilitySlots: Array.isArray(prof.availabilitySlots) ? prof.availabilitySlots : [],
      }));
    }
  }, [me]);

  const uploadMutation = useUploadProfilePhoto();

  const saveMutation = useUpdateMentorProfile();
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});

  const validateForm = () => {
    const errs: { [k: string]: string } = {};
    const name = form.displayName.trim();
    if (!name || name.length > 64) {
      errs.displayName = 'Display name is required (max 64 characters).';
    }
    if (form.bio.length > 2000) {
      errs.bio = 'Bio must be 2000 characters or less.';
    }
    const invalidExpertise = form.expertiseAreas.find((e) => !e || e.length > 50);
    if (invalidExpertise) errs.expertiseAreas = 'Expertise items must be non-empty and ≤ 50 chars.';
    const invalidSkills = form.skills.find((s) => !s || s.length > 50);
    if (invalidSkills) errs.skills = 'Skills must be non-empty and ≤ 50 chars.';
    const validDays = ['mon','tue','wed','thu','fri','sat','sun'];
    const badSlot = form.availabilitySlots.find((s) => !validDays.includes(s.day) || !s.start || !s.end || s.start >= s.end);
    if (badSlot) errs.availabilitySlots = 'Each availability slot must have a valid day and start time earlier than end time.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setSaving(true);
    const payload = {
      displayName: form.displayName,
      photoUrl: form.photoUrl,
      bio: form.bio,
      expertiseAreas: form.expertiseAreas,
      skills: form.skills,
      availabilitySlots: form.availabilitySlots,
    };
    saveMutation.mutate(payload, {
      onSuccess: () => {
        setSuccess('Profile saved');
        setSaving(false);
        queryClient.invalidateQueries({ queryKey: ['my-profile'] });
        setTimeout(() => setSuccess(''), 2500);
      },
      onError: (e: any) => {
        setError(e?.response?.data?.message || 'Failed to save profile');
        setSaving(false);
      }
    });
  };

  if (isLoading) {
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
      <div className="tw-max-w-4xl tw-mx-auto tw-p-4 tw-space-y-6">
        <h1 className="tw-text-2xl tw-font-semibold">Mentor Profile</h1>
        {error && <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-700 tw-rounded tw-p-3">{error}</div>}
        {success && <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-text-green-700 tw-rounded tw-p-3">{success}</div>}
        <form onSubmit={onSubmit} className="tw-space-y-6">
          {/* Photo & Display Name */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-4">
            <div className="tw-flex tw-gap-4 tw-flex-wrap tw-items-center">
              <img
                src={form.photoUrl || 'https://via.placeholder.com/96x96'}
                alt="mentor avatar"
                className="tw-w-24 tw-h-24 tw-rounded-full tw-object-cover tw-border tw-border-gray-200"
              />
              <div className="tw-space-y-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-lg tw-px-3 tw-py-2"
                  disabled={uploadMutation.isLoading}
                >{uploadMutation.isLoading ? `Uploading… ${uploadMutation.progress}%` : 'Upload Photo'}</button>
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  className="tw-hidden"
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                  onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
                />
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Display name</label>
                  <input
                    className="tw-mt-1 tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-w-64"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    maxLength={64}
                    placeholder="Your public display name"
                    title="Display name"
                    aria-label="Display name"
                  />
                  {fieldErrors.displayName && (
                    <div className="tw-text-xs tw-text-red-600 tw-mt-1" role="alert">{fieldErrors.displayName}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">Bio</label>
            <textarea
              className="tw-w-full tw-min-h-[120px] tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={2000}
              placeholder="Describe your mentoring experience, approach, and areas of interest"
              title="Bio"
              aria-label="Mentor bio"
            />
            <div className="tw-text-right tw-text-xs tw-text-gray-500">{form.bio.length}/2000</div>
            {fieldErrors.bio && (
              <div className="tw-text-xs tw-text-red-600" role="alert">{fieldErrors.bio}</div>
            )}
          </div>

          {/* Expertise & Skills */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-4">
            <ChipInput label="Expertise areas" values={form.expertiseAreas} onChange={(vals) => setForm({ ...form, expertiseAreas: vals })} placeholder="e.g., Algorithms" />
            {fieldErrors.expertiseAreas && (
              <div className="tw-text-xs tw-text-red-600" role="alert">{fieldErrors.expertiseAreas}</div>
            )}
            <ChipInput label="Skills" values={form.skills} onChange={(vals) => setForm({ ...form, skills: vals })} placeholder="e.g., React" />
            {fieldErrors.skills && (
              <div className="tw-text-xs tw-text-red-600" role="alert">{fieldErrors.skills}</div>
            )}
          </div>

          {/* Availability */}
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <AvailabilityEditor slots={form.availabilitySlots} onChange={(next) => setForm({ ...form, availabilitySlots: next })} />
            {fieldErrors.availabilitySlots && (
              <div className="tw-text-xs tw-text-red-600 tw-mt-2" role="alert">{fieldErrors.availabilitySlots}</div>
            )}
          </div>

          {/* Submit */}
          <div className="tw-flex tw-justify-end">
            <button
              type="submit"
              disabled={saving || saveMutation.isLoading}
              className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-font-medium tw-rounded-lg tw-px-6 tw-py-2 disabled:tw-opacity-50"
            >{saving || saveMutation.isLoading ? 'Saving…' : 'Save Profile'}</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default React.memo(MentorProfileEditor);
