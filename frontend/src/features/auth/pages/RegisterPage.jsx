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
      <form onSubmit={onSubmit} className="tw-space-y-4">
        {error && <div className="tw-p-3 tw-rounded tw-bg-red-50 tw-text-red-700 tw-text-sm">{error}</div>}
        
        {/* Name Fields */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          {/* Firstname Input with Icon */}
          <div className="tw-relative">
            <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
              <svg className="tw-h-5 tw-w-5 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input 
              className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors" 
              placeholder="Firstname" 
              name="firstname" 
              value={form.firstname} 
              onChange={onChange} 
              required 
            />
          </div>

          {/* Lastname Input with Icon */}
          <div className="tw-relative">
            <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
              <svg className="tw-h-5 tw-w-5 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input 
              className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors" 
              placeholder="Lastname" 
              name="lastname" 
              value={form.lastname} 
              onChange={onChange} 
              required 
            />
          </div>
        </div>

        {/* Email Input with Icon */}
        <div className="tw-relative">
          <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
            <svg className="tw-h-5 tw-w-5 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input 
            className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors" 
            placeholder="Email" 
            type="email" 
            name="email" 
            value={form.email} 
            onChange={onChange} 
            required 
          />
        </div>

        {/* Password Input with Icon */}
        <div className="tw-relative">
          <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
            <svg className="tw-h-5 tw-w-5 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input 
            className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors" 
            placeholder="Password" 
            type="password" 
            name="password" 
            value={form.password} 
            onChange={onChange} 
            required 
          />
        </div>

        {/* Terms Agreement */}
        <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
          <input 
            type="checkbox" 
            name="agree" 
            checked={form.agree} 
            onChange={onChange}
            className="tw-rounded tw-border-gray-300 tw-text-purple-600 focus:tw-ring-purple-500"
          />
          <span>I agree to the <span className="tw-text-purple-600 tw-font-medium">Terms & Conditions</span></span>
        </label>

        {/* Create Account Button */}
        <button 
          disabled={loading} 
          className="tw-w-full tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-py-3 tw-font-semibold tw-transition-colors tw-uppercase"
        >
          {loading ? 'Creating...' : 'CREATE ACCOUNT'}
        </button>

        {/* OR Divider */}
        <div className="tw-flex tw-items-center tw-gap-4 tw-my-4">
          <div className="tw-flex-1 tw-h-px tw-bg-gray-200" />
          <span className="tw-text-sm tw-text-gray-500">Or register with</span>
          <div className="tw-flex-1 tw-h-px tw-bg-gray-200" />
        </div>

        {/* Google Button with Logo */}
        <button 
          type="button" 
          onClick={() => (window.location.href = googleOAuthUrl())} 
          className="tw-w-full tw-border tw-border-gray-300 hover:tw-border-gray-400 tw-rounded-xl tw-py-3 tw-font-medium tw-transition-colors tw-flex tw-items-center tw-justify-center tw-gap-3"
        >
          <svg className="tw-w-5 tw-h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Google</span>
        </button>

        {/* Login Link */}
        <p className="tw-text-sm tw-text-center tw-text-gray-600">
          Have an account? <Link to="/login" className="tw-text-purple-600 hover:tw-text-purple-700 tw-font-semibold">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}


