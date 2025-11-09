import React from 'react';

export default function AuthLayout({ title, subtitle, children }) {

  return (
    <div className="tw-min-h-screen tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-bg-white tw-text-gray-900  ">
      {/* Left Side - Purple Gradient */}
      <div className="tw-bg-gradient-to-br tw-from-purple-700 tw-to-purple-900 tw-px-8 tw-py-12 tw-text-white tw-flex tw-flex-col tw-relative">
        {/* Logo Section */}
        <div className="tw-flex tw-justify-start tw-mb-20">
          <div className="tw-bg-white/10 tw-rounded-br-[120px] tw-pt-8 tw-pl-8 tw-pr-16 tw-pb-16">
            <div className="tw-w-32 tw-h-32 md:tw-w-40 md:tw-h-40 tw-rounded-full tw-bg-white tw-flex tw-items-center tw-justify-center tw-p-2">
              <img
                src="/logo.png"
                alt="Information Technology Computer Society logo"
                className="tw-w-[85%] tw-h-[85%] tw-object-contain"
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* Welcome Text Section - Centered vertically in remaining space */}
        <div className="tw-flex tw-flex-col tw-justify-center tw-flex-1 tw-pb-20">
          <div className="tw-max-w-xl">
            <h1 className="tw-text-5xl md:tw-text-6xl tw-font-extrabold tw-tracking-tight tw-mb-4">
              {title}
            </h1>
            {subtitle && <p className="tw-text-xl tw-text-white/90">{subtitle}</p>}
          </div>
        </div>

        {/* Decorative Wave Elements */}
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-32 tw-overflow-hidden">
          <svg
            className="tw-w-full tw-h-full"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
              fill="rgba(255,255,255,0.1)"
            />
            <path
              d="M0,80 Q300,40 600,80 T1200,80 L1200,120 L0,120 Z"
              fill="rgba(255,255,255,0.05)"
            />
            {/* Dots */}
            <circle cx="200" cy="50" r="2" fill="rgba(255,255,255,0.3)" />
            <circle cx="400" cy="45" r="2" fill="rgba(255,255,255,0.3)" />
            <circle cx="600" cy="55" r="2" fill="rgba(255,255,255,0.3)" />
            <circle cx="800" cy="48" r="2" fill="rgba(255,255,255,0.3)" />
            <circle cx="1000" cy="52" r="2" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>
      </div>

      {/* Right Side - White Background */}
      <div className="tw-flex tw-items-center tw-justify-center tw-p-4 md:tw-p-8 tw-bg-white">
        <div className="tw-w-full tw-max-w-md tw-space-y-5">
          <div className="tw-w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}


