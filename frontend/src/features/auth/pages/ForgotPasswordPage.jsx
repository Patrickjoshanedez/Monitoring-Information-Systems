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
      <form onSubmit={onSubmit} className="tw-space-y-4">
        {message && <div className="tw-p-3 tw-rounded tw-bg-green-50 tw-text-green-700 tw-text-sm">{message}</div>}
        {error && <div className="tw-p-3 tw-rounded tw-bg-red-50 tw-text-red-700 tw-text-sm">{error}</div>}
        
        {/* Email Input with Icon */}
        <div className="tw-relative">
          <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
            <svg className="tw-h-5 tw-w-5 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input 
            type="email" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)} 
            placeholder="Enter institutional email" 
            className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors" 
            required 
          />
        </div>

        {/* Submit Button */}
        <button 
          disabled={loading} 
          className="tw-px-6 tw-py-3 tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-w-40 tw-font-semibold tw-transition-colors"
        >
          {loading ? 'Sending...' : 'Submit'}
        </button>
      </form>
    </AuthLayout>
  );
}


