import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          setError('OAuth authentication failed');
          setLoading(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!token) {
          setError('No authentication token received');
          setLoading(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Store the token
        localStorage.setItem('token', token);

        // Try to fetch user profile from backend to get accurate application status
        try {
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const res = await fetch(`${API_BASE}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            const user = await res.json();
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect based on role and application status
            const role = user.role;
            const applicationStatus = user.applicationStatus || 'not_submitted';

            if (!role || role === null) {
              navigate('/role-selection');
            } else if (role === 'admin') {
              navigate('/admin/dashboard');
            } else if (role === 'mentor') {
              if (applicationStatus === 'not_submitted') navigate('/mentor/application');
              else if (applicationStatus === 'pending') navigate('/mentor/pending');
              else if (applicationStatus === 'approved') navigate('/mentor/dashboard');
              else navigate('/mentor/application');
            } else if (role === 'mentee') {
              if (applicationStatus === 'not_submitted') navigate('/mentee/application');
              else if (applicationStatus === 'pending') navigate('/mentee/pending');
              else if (applicationStatus === 'approved') navigate('/mentee/dashboard');
              else navigate('/mentee/application');
            }
          } else {
            // If profile fetch fails, fallback to token decode
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user = { id: payload.id, role: payload.role, applicationStatus: 'not_submitted' };
            localStorage.setItem('user', JSON.stringify(user));
            if (!payload.role || payload.role === null) navigate('/role-selection');
            else if (payload.role === 'mentee') navigate('/mentee/application');
            else if (payload.role === 'mentor') navigate('/mentor/application');
            else if (payload.role === 'admin') navigate('/admin/dashboard');
          }
        } catch (profileErr) {
          console.error('Failed to fetch profile:', profileErr);
          // Fallback: decode token and continue
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user = { id: payload.id, role: payload.role, applicationStatus: 'not_submitted' };
            localStorage.setItem('user', JSON.stringify(user));
            if (!payload.role || payload.role === null) navigate('/role-selection');
            else if (payload.role === 'mentee') navigate('/mentee/application');
            else if (payload.role === 'mentor') navigate('/mentor/application');
            else if (payload.role === 'admin') navigate('/admin/dashboard');
          } catch (decodeError) {
            console.error('Failed to decode token after profile fetch failure:', decodeError);
            setError('Invalid authentication token');
            setLoading(false);
            setTimeout(() => navigate('/login'), 3000);
          }
        }

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-gray-50">
        <div className="tw-text-center">
          <div className="tw-animate-spin tw-rounded-full tw-h-12 tw-w-12 tw-border-b-2 tw-border-purple-500 tw-mx-auto tw-mb-4"></div>
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900 tw-mb-2">
            Completing Authentication...
          </h2>
          <p className="tw-text-gray-600">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-gray-50">
        <div className="tw-text-center tw-max-w-md tw-mx-auto tw-px-4">
          <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-6">
            <div className="tw-text-red-600 tw-text-6xl tw-mb-4">⚠️</div>
            <h2 className="tw-text-xl tw-font-semibold tw-text-red-800 tw-mb-2">
              Authentication Failed
            </h2>
            <p className="tw-text-red-600 tw-mb-4">{error}</p>
            <p className="tw-text-sm tw-text-gray-500">
              Redirecting to login page in a few seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
