import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthLayout from './AuthLayout.jsx';
import { resetPassword, mapErrorCodeToMessage } from '../services/api.js';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, { password });
      navigate('/login');
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
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter new password" className="w-full border-2 border-primary/40 focus:border-primary rounded-xl px-4 py-3 outline-none" required />
        <button disabled={loading} className="px-6 py-3 bg-primary text-white rounded-xl w-32">{loading ? 'Saving...' : 'Verify'}</button>
      </form>
    </AuthLayout>
  );
}


