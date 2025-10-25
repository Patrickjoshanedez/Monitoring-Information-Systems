import React from 'react';
import { useEffect } from 'react';

export default function OAuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        if (role === 'admin') window.location.replace('/admin/dashboard');
        else if (role === 'mentor') window.location.replace('/mentor/dashboard');
        else window.location.replace('/mentee/dashboard');
      } catch {
        window.location.replace('/login');
      }
    } else {
      window.location.replace('/login');
    }
  }, []);

  return (
    <div className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-white tw-text-gray-900 dark:tw-bg-slate-950 dark:tw-text-slate-100">
      Signing you in…
    </div>
  );
}


