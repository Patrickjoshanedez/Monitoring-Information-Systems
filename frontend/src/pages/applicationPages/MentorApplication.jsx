import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/config/apiClient';
//

const MAJORS = [
  'Computer Programming 1', 'Computer Programming 2', 'Web Development', 'App Development',
  'Database Management', 'Networking 1', 'Networking 2', 'Data Structures and Algo'
];

export default function MentorApplication() {
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', password: '', yearLevel: '', program: '', skills: '', cor: null, majors: [], note: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // reCAPTCHA removed
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'cor') return setForm({ ...form, cor: files?.[0] || null });
    setForm({ ...form, [name]: value });
  };

  const toggleMajor = (m) => {
    setForm((s) => ({ ...s, majors: s.majors.includes(m) ? s.majors.filter(x => x !== m) : [...s.majors, m] }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // reCAPTCHA removed
    
    setLoading(true);
    try {
      const payload = {
        role: 'mentor',
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
        yearLevel: form.yearLevel,
        program: form.program,
        skills: form.skills,
        majors: form.majors,
        note: form.note || ''
      };

      const res = await apiClient.post('/auth/register', payload);
      // Navigate to verification page so user can enter the code sent by email
      window.location.href = `/verify-email?email=${encodeURIComponent(form.email)}`;
    } catch (err) {
      // Show helpful error messages from the server when available
      // eslint-disable-next-line no-console
      console.error('Registration error (mentor):', err);
      const resp = err?.response?.data || {};
      let message = resp.message || resp.detail || err.message || 'Registration failed. Please check your information and try again.';
      if (!message && Array.isArray(resp.errors)) {
        message = resp.errors.map((e) => e.msg || e.message || JSON.stringify(e)).join('; ');
      }
      if (resp.error === 'EMAIL_EXISTS' || resp.code === 'EMAIL_EXISTS') {
        message = 'An account with this email already exists.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw-max-w-4xl tw-mx-auto tw-py-8">
      <h1 className="tw-text-3xl tw-font-extrabold tw-text-center tw-mb-8">Mentor Application Form</h1>
      {error && <div className="tw-mb-4 tw-text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="tw-space-y-6">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
          <input name="firstname" placeholder="Firstname" value={form.firstname} onChange={onChange} className="tw-w-full tw-border tw-rounded-xl tw-px-4 tw-py-3" required />
          <input name="lastname" placeholder="Lastname" value={form.lastname} onChange={onChange} className="tw-w-full tw-border tw-rounded-xl tw-px-4 tw-py-3" required />
          <input name="email" type="email" placeholder="Institutional Email" value={form.email} onChange={onChange} className="tw-w-full tw-border tw-rounded-xl tw-px-4 tw-py-3" required />
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
          <select name="yearLevel" value={form.yearLevel} onChange={onChange} className="tw-border tw-rounded-xl tw-px-4 tw-py-3">
            <option value="">Year Level</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
          </select>
          <input name="program" placeholder="Program" value={form.program} onChange={onChange} className="tw-border tw-rounded-xl tw-px-4 tw-py-3" />
          <input name="skills" placeholder="Specific Skills" value={form.skills} onChange={onChange} className="tw-border tw-rounded-xl tw-px-4 tw-py-3" />
          <label className="tw-border tw-rounded-xl tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between">
            <span>Please insert COR</span>
            <input name="cor" type="file" accept="application/pdf,image/*" onChange={onChange} className="tw-ml-2" />
          </label>
        </div>

        <div>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-3">Choose a major based on your area of interest. (Choose as many as you want)</p>
          <div className="tw-flex tw-flex-wrap tw-gap-4">
            {MAJORS.map((m) => (
              <button type="button" key={m} onClick={() => toggleMajor(m)} className={`tw-px-4 tw-py-2 tw-rounded tw-border ${form.majors.includes(m) ? 'tw-bg-gray-200' : 'tw-bg-gray-100'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea name="note" placeholder="Why do you want to join this program? (Optional)" value={form.note} onChange={onChange} className="tw-w-full tw-border tw-rounded tw-p-4 tw-min-h-[120px]" />
        </div>

        {/* reCAPTCHA removed */}
        
        <div className="tw-flex tw-justify-end">
          <button className="tw-bg-primary tw-text-white tw-px-6 tw-py-2 tw-rounded-xl" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
