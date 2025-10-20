import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { register, googleOAuthUrl, mapErrorCodeToMessage } from '../services/api.js';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', password: '', agree: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.agree) {
      setError('You must agree to the Terms & Conditions.');
      return;
    }
    setLoading(true);
    try {
      await register({ firstname: form.firstname, lastname: form.lastname, email: form.email, password: form.password, role: 'mentee' });
      window.location.href = '/login';
    } catch (err) {
      const code = err?.response?.data?.error;
      setError(mapErrorCodeToMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="WELCOME!" subtitle="Your path to guided learning and mentorship starts here.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border-2 border-primary/40 focus:border-primary rounded-xl px-4 py-3 outline-none" placeholder="Firstname" name="firstname" value={form.firstname} onChange={onChange} required />
          <input className="border-2 border-primary/40 focus:border-primary rounded-xl px-4 py-3 outline-none" placeholder="Lastname" name="lastname" value={form.lastname} onChange={onChange} required />
        </div>
        <input className="w-full border-2 border-primary/40 focus:border-primary rounded-xl px-4 py-3 outline-none" placeholder="Email" type="email" name="email" value={form.email} onChange={onChange} required />
        <input className="w-full border-2 border-primary/40 focus:border-primary rounded-xl px-4 py-3 outline-none" placeholder="Password" type="password" name="password" value={form.password} onChange={onChange} required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} />
          <span>I agree to the <span className="text-primary">Terms & Condition</span></span>
        </label>
        <button disabled={loading} className="w-full bg-primary text-white rounded-xl py-3 font-semibold">{loading ? 'Creating...' : 'CREATE ACCOUNT'}</button>
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500">Or register with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button type="button" onClick={() => (window.location.href = googleOAuthUrl())} className="w-full border rounded-xl py-3 font-medium">
          Google
        </button>
        <p className="text-sm text-center">Have an account? <Link to="/login" className="text-primary font-semibold">Login</Link></p>
      </form>
    </AuthLayout>
  );
}


