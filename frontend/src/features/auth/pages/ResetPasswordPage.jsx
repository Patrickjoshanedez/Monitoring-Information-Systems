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
      <form onSubmit={onSubmit} className="tw-space-y-4">
        {error && <div className="tw-p-3 tw-rounded tw-bg-red-50 tw-text-red-700 tw-text-sm dark:tw-bg-red-500/10 dark:tw-text-red-200">{error}</div>}
        
        {/* Password Input with Icon */}
        <div className="tw-relative">
          <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
            <svg className="tw-h-5 tw-w-5 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input 
            type="password" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
            placeholder="Enter new password" 
            className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors dark:tw-border-slate-700 dark:tw-bg-slate-900 dark:focus:tw-border-purple-400 dark:tw-text-slate-100 dark:placeholder:tw-text-slate-500" 
            required 
          />
        </div>

        {/* Verify Button */}
        <button 
          disabled={loading} 
          className="tw-px-6 tw-py-3 tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-w-32 tw-font-semibold tw-transition-colors disabled:tw-opacity-70"
        >
          {loading ? 'Saving...' : 'Verify'}
        </button>
      </form>
    </AuthLayout>
  );
}


