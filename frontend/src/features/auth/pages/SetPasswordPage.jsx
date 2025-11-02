import React, { useRef, useState } from 'react';
import AuthLayout from './AuthLayout.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/auth/set-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Failed to set password.');
        return;
      }

      setSuccess('Your password has been set. Redirecting...');
      // Refresh profile to update passwordSet + redirect by role/status
      setTimeout(async () => {
        try {
          const profileRes = await fetch(buildApiUrl('/auth/profile'), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const user = await profileRes.json();
            localStorage.setItem('user', JSON.stringify(user));
            const role = user.role;
            const applicationStatus = user.applicationStatus || 'not_submitted';
            if (!role) {
              window.location.href = '/role-selection';
            } else if (role === 'admin') {
              window.location.href = applicationStatus === 'approved' ? '/admin/dashboard' : '/admin/pending';
            } else if (role === 'mentor') {
              if (applicationStatus === 'approved') window.location.href = '/mentor/dashboard';
              else if (applicationStatus === 'pending') window.location.href = '/mentor/pending';
              else window.location.href = '/mentor/application';
            } else if (role === 'mentee') {
              if (applicationStatus === 'approved') window.location.href = '/mentee/dashboard';
              else if (applicationStatus === 'pending') window.location.href = '/mentee/pending';
              else window.location.href = '/mentee/application';
            } else {
              window.location.href = '/';
            }
          } else {
            window.location.href = '/';
          }
        } catch {
          window.location.href = '/';
        }
      }, 1200);
    } catch {
      setError('Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set your password" subtitle="Secure your account to enable email/password login.">
      <form ref={formRef} onSubmit={onSubmit} className="tw-space-y-4">
        {error && <div className="tw-p-3 tw-rounded tw-bg-red-50 tw-text-red-700 tw-text-sm">{error}</div>}
        {success && <div className="tw-p-3 tw-rounded tw-bg-green-50 tw-text-green-700 tw-text-sm">{success}</div>}

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none"
            minLength={8}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="tw-w-full tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-py-3 tw-font-semibold tw-transition-colors tw-uppercase disabled:tw-opacity-70"
        >
          {loading ? 'Saving...' : 'Set Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
