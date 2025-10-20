import React from 'react';
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="auth-hero p-10 text-white flex flex-col justify-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            {title}
          </h1>
          {subtitle && <p className="text-lg opacity-90">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl">{children}</div>
      </div>
    </div>
  );
}


