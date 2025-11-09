import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/config/apiClient';
//

export default function AdminApplication() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // reCAPTCHA removed
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // reCAPTCHA removed
    
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { ...form, role: 'admin' });
      window.location.href = `/verify-email?email=${encodeURIComponent(form.email)}`;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Registration error (admin):', err);
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
    <div className="tw-max-w-md tw-mx-auto tw-py-8">
      <div className="tw-bg-white tw-border tw-border-gray-100 tw-rounded-2xl tw-p-6 tw-shadow-sm">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-4 tw-text-center">Admin Application</h1>
        {error && <div className="tw-mb-4 tw-text-red-600">{error}</div>}
        <form onSubmit={onSubmit} className="tw-space-y-4">
          <input name="name" placeholder="Full name" value={form.name} onChange={onChange} className="tw-w-full tw-border tw-p-3 tw-rounded-xl" required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} className="tw-w-full tw-border tw-p-3 tw-rounded-xl" required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} className="tw-w-full tw-border tw-p-3 tw-rounded-xl" required />
          
          {/* reCAPTCHA removed */}
          
          <div className="tw-flex tw-justify-end">
            <button className="tw-bg-primary tw-text-white tw-px-6 tw-py-2 tw-rounded-xl" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
