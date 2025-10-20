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

  return <div className="min-h-screen flex items-center justify-center">Signing you in…</div>;
}


