import React from 'react';

export default function AuthLayout({ title, subtitle, children }) {

  return (
    <div className="tw-min-h-screen tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-bg-white tw-text-gray-900  ">
      {/* Left Side - Purple Gradient */}
      <div className="tw-bg-gradient-to-br tw-from-purple-700 tw-to-purple-900 tw-p-10 tw-text-white tw-flex tw-flex-col tw-justify-between tw-relative  ">
        {/* Solid trail touching the top, with circular badge overlapping near its lower end */}
  <div className="tw-absolute tw-top-0 tw-left-3 md:tw-left-4 lg:tw-left-6 tw-select-none">
          <div className="tw-relative">
            {/* Trail (solid panel) */}
            <div className="
              tw-w-32 md:tw-w-44 lg:tw-w-56
              tw-h-40 md:tw-h-52 lg:tw-h-64
              tw-bg-gray-100 tw-rounded-br-3xl
            "></div>

            {/* Badge positioned centered on the trail */}
            <div className="tw-absolute tw-left-1/2 tw--translate-x-1/2 tw-top-24 md:tw-top-32 lg:tw-top-40">
              <div
                className="
                  tw-relative
                  tw-w-32 tw-h-32 md:tw-w-44 md:tw-h-44 lg:tw-w-56 lg:tw-h-56
                  tw-rounded-full tw-bg-gradient-to-br tw-from-white tw-to-gray-200
                  tw-shadow-2xl tw-ring-1 tw-ring-white/60
                "
              >
                <div className="tw-absolute tw-inset-2 md:tw-inset-3 lg:tw-inset-4 tw-rounded-full tw-bg-gray-50 tw-shadow-xl tw-ring-1 tw-ring-gray-200 tw-flex tw-items-center tw-justify-center">
                  <img
                    src="/itcs-logo.png"
                    alt="Information Technology Computer Society logo"
                    className="tw-w-[70%] tw-h-[70%] tw-object-contain tw-rounded-full tw-drop-shadow-md"
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo.svg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="tw-flex tw-flex-col tw-justify-center tw-flex-1">
          <div className="tw-max-w-xl tw-mx-auto tw-text-center">
            <h1 className="tw-text-4xl md:tw-text-5xl tw-font-extrabold tw-tracking-tight tw-mb-4">
              {title}
            </h1>
            {subtitle && <p className="tw-text-lg tw-opacity-90">{subtitle}</p>}
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
      <div className="tw-flex tw-items-center tw-justify-center tw-p-6 md:tw-p-10 tw-bg-white ">
        <div className="tw-w-full tw-max-w-xl tw-space-y-6">
          <div className="tw-w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}


