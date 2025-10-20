import React from 'react';
import { useState } from 'react';
import AuthLayout from './AuthLayout.jsx';
import { forgotPassword, mapErrorCodeToMessage } from '../services/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setMessage('If the email exists, a reset link has been sent.');
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
        {message && <div className="p-3 rounded bg-green-50 text-green-700 text-sm">{message}</div>}
        {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter institutional email" className="w-full border-2 border-primary/40 focus:border-primary rounded-xl px-4 py-3 outline-none" required />
        <button disabled={loading} className="px-6 py-3 bg-primary text-white rounded-xl w-40">{loading ? 'Sending...' : 'Submit'}</button>
      </form>
    </AuthLayout>
  );
}


