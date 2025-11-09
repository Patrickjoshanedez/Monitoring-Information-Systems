import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { sendVerificationCode, verifyEmail } from '../services/api.js';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    setMessage('');
    setLoading(true);
    try {
      await sendVerificationCode({ email });
      setMessage('Verification code sent. Check your email.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // If the page was opened with an email in the query, auto-send a code once
  useEffect(() => {
    if (emailFromQuery) {
      // fire-and-forget the send, user can re-send manually if needed
      handleSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await verifyEmail({ email, code });
      setMessage('Email verified! Redirecting to login...');
      // short delay so user can see the success message
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Verify your email" subtitle="Enter the code sent to your email">
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-[60vh]">
        <div
          role="dialog"
          aria-labelledby="verify-title"
          className="tw-bg-white tw-rounded-lg tw-shadow-md tw-w-full tw-max-w-md tw-p-6"
        >
          <h2 id="verify-title" className="tw-text-2xl tw-font-semibold tw-mb-2">Verify your email</h2>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
            We sent a 6-digit verification code to <span className="tw-font-medium">{email || 'your email'}</span>.
            Enter the code below to confirm your address and continue to login.
          </p>

          <form onSubmit={handleVerify} className="tw-space-y-4" aria-describedby="verify-instructions">
            <div>
              <label htmlFor="email" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="tw-mt-1 tw-block tw-w-full tw-border tw-rounded tw-p-2"
                aria-required="true"
                type="email"
              />
            </div>

            <div>
              <label htmlFor="code" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Verification code</label>
              <input
                id="code"
                name="code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="tw-mt-1 tw-block tw-w-full tw-border tw-rounded tw-p-3 tw-text-lg tw-tracking-widest tw-text-center"
                aria-required="true"
                aria-label="Verification code"
                onKeyDown={(e) => { if (e.key === 'Enter') { handleVerify(e); } }}
                ref={(el) => { if (el && emailFromQuery) el.focus(); }}
              />
            </div>

            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <button
                  type="button"
                  onClick={handleSend}
                  className="tw-bg-white tw-border tw-border-gray-300 tw-text-gray-800 tw-px-3 tw-py-2 tw-rounded"
                  disabled={loading || !email}
                >
                  {loading ? 'Sending…' : 'Resend code'}
                </button>
                <Link to="/login" className="tw-text-sm tw-text-gray-500">Back to login</Link>
              </div>

              <div>
                <button
                  type="submit"
                  className="tw-bg-primary tw-text-white tw-px-4 tw-py-2 tw-rounded"
                  disabled={loading || !code}
                >
                  {loading ? 'Verifying…' : 'Verify'}
                </button>
              </div>
            </div>

            <div id="verify-instructions" className="tw-text-sm tw-text-gray-600" aria-live="polite">
              {message || 'Enter the 6-digit code sent to your email. If you didn\'t receive it, click "Resend code".'}
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
