import React, { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

const RecaptchaField = forwardRef(({ onChange, onExpired, className = '' }, ref) => {
  if (!siteKey) {
    return (
      <div className={`tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700 ${className}`}>
        reCAPTCHA is not configured. Please set the VITE_RECAPTCHA_SITE_KEY environment variable.
      </div>
    );
  }

  return (
    <div className={`tw-flex tw-justify-center ${className}`}>
      <ReCAPTCHA
        ref={ref}
        sitekey={siteKey}
        onChange={onChange}
        onExpired={onExpired}
        theme="light"
      />
    </div>
  );
});

RecaptchaField.displayName = 'RecaptchaField';

export default RecaptchaField;
