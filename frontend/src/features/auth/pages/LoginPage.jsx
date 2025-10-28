import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { login, googleOAuthUrl, facebookOAuthUrl, mapErrorCodeToMessage } from '../services/api.js';
import RecaptchaField from '../../../components/common/RecaptchaField.jsx';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const recaptchaRef = useRef(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecaptchaError('');
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the verification step.');
      return;
    }
    setLoading(true);
    try {
      const res = await login({ ...form, recaptchaToken });
      const token = res.token;
      localStorage.setItem('token', token);

      const normalizedRole = (res.role || res.user?.role || '').toLowerCase();
      const sanitizedUser = {
        ...res.user,
        role: normalizedRole || null
      };
      localStorage.setItem('user', JSON.stringify(sanitizedUser));
      
      const applicationStatus = res.user?.applicationStatus || 'not_submitted';
      
      // Check if user has selected a role
      if (!normalizedRole) {
        // User hasn't selected a role yet, redirect to role selection
        window.location.href = '/role-selection';
        return;
      }
      
      // Redirect based on role and application status
      if (normalizedRole === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (normalizedRole === 'mentor') {
        if (applicationStatus === 'not_submitted' || !applicationStatus) {
          window.location.href = '/mentor/application';
        } else if (applicationStatus === 'pending') {
          window.location.href = '/mentor/pending';
        } else if (applicationStatus === 'approved') {
          window.location.href = '/mentor/dashboard';
        } else {
          window.location.href = '/mentor/application';
        }
      } else if (normalizedRole === 'mentee') {
        // Handle mentee application flow
        if (applicationStatus === 'not_submitted' || !applicationStatus) {
          window.location.href = '/mentee/application';
        } else if (applicationStatus === 'pending') {
          window.location.href = '/mentee/pending';
        } else if (applicationStatus === 'approved') {
          window.location.href = '/mentee/dashboard';
        } else {
          // Default to application form for rejected or unknown status
          window.location.href = '/mentee/application';
        }
      }
    } catch (err) {
      const code = err?.response?.data?.error;
      setError(mapErrorCodeToMessage(code));
    } finally {
      setLoading(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken('');
    }
  };

  return (
    <AuthLayout title="WELCOME BACK!" subtitle="Your path to guided learning and mentorship starts here.">
      <div className="tw-mb-4">
        <Link
          to="/"
          className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-purple-600 hover:tw-text-purple-700"
        >
          <span aria-hidden="true">&larr;</span>
          Return to landing page
        </Link>
      </div>
      <form onSubmit={onSubmit} className="tw-space-y-4">
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
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Username or email"
            className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
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
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
            required
          />
        </div>

        {/* Forgot Password Link */}
        <div className="tw-flex tw-items-center tw-justify-end tw-text-sm">
          <Link to="/forgot-password" className="tw-text-purple-600 hover:tw-text-purple-700 tw-font-medium">
            Forgot Password?
          </Link>
        </div>

        <div>
          <RecaptchaField
            ref={recaptchaRef}
            onChange={(token) => {
              setRecaptchaToken(token || '');
              if (token) {
                setRecaptchaError('');
              }
            }}
            onExpired={() => {
              setRecaptchaToken('');
              setRecaptchaError('Verification expired, please try again.');
            }}
          />
          {recaptchaError && (
            <p className="tw-mt-2 tw-text-xs tw-text-red-600">{recaptchaError}</p>
          )}
        </div>

        {/* Login Button */}
        <button 
          disabled={loading} 
          className="tw-w-full tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-py-3 tw-font-semibold tw-transition-colors tw-uppercase disabled:tw-opacity-70"
        >
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>

        {/* OR Divider */}
        <div className="tw-flex tw-items-center tw-gap-4 tw-my-4">
          <div className="tw-flex-1 tw-h-px tw-bg-gray-200" />
          <span className="tw-text-sm tw-text-gray-500">OR</span>
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
          <span>Continue with Google</span>
        </button>

        {/* Facebook Button */}
        <button
          type="button"
          onClick={() => (window.location.href = facebookOAuthUrl())}
          className="tw-w-full tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-rounded-xl tw-py-3 tw-font-medium tw-transition-colors tw-flex tw-items-center tw-justify-center tw-gap-3"
        >
          <svg className="tw-w-5 tw-h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M22 12.07C22 6.49 17.52 2 11.93 2 6.35 2 1.86 6.49 1.86 12.07c0 4.93 3.6 9.03 8.31 9.93v-7.03H7.9v-2.9h2.27V9.41c0-2.25 1.34-3.5 3.4-3.5.99 0 2.02.18 2.02.18v2.24h-1.14c-1.12 0-1.47.69-1.47 1.4v1.68h2.5l-.4 2.9h-2.1V22c4.71-.9 8.31-5 8.31-9.93Z" />
          </svg>
          <span>Continue with Facebook</span>
        </button>

        {/* Register Link */}
        <p className="tw-text-sm tw-text-center tw-text-gray-600">
          Don't have an account? <Link to="/register" className="tw-text-purple-600 hover:tw-text-purple-700 tw-font-semibold">Register</Link>
        </p>
      </form>
    </AuthLayout>
  );
}


