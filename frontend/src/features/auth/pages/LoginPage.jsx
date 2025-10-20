import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { login, googleOAuthUrl, mapErrorCodeToMessage } from '../services/api.js';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      const token = res.token;
      localStorage.setItem('token', token);
      const role = res.role;
      if (role === 'admin') window.location.href = '/admin/dashboard';
      else if (role === 'mentor') window.location.href = '/mentor/dashboard';
      else window.location.href = '/mentee/dashboard';
    } catch (err) {
      const code = err?.response?.data?.error;
      setError(mapErrorCodeToMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="WELCOME BACK!" subtitle="Your path to guided learning and mentorship starts here.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
        <div>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Username or email"
            className="w-full border-2 border-primary/40 focus:border-primary rounded-xl px-4 py-3 outline-none"
            required
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            className="w-full border-2 border-primary/40 focus:border-primary rounded-xl px-4 py-3 outline-none"
            required
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <div />
          <Link to="/forgot-password" className="text-primary font-medium">Forgot Password?</Link>
        </div>
        <button disabled={loading} className="w-full bg-primary text-white rounded-xl py-3 font-semibold">
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button type="button" onClick={() => (window.location.href = googleOAuthUrl())} className="w-full border rounded-xl py-3 font-medium">
          Continue with Google
        </button>
        <p className="text-sm text-center">Don't have an account? <Link to="/register" className="text-primary font-semibold">Register</Link></p>
      </form>
    </AuthLayout>
  );
}


