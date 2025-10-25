import React, { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useTheme } from '../../context/ThemeContext';

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

const RecaptchaField = forwardRef(({ onChange, onExpired, className = '' }, ref) => {
  const { theme } = useTheme();
  const captchaTheme = theme === 'dark' ? 'dark' : 'light';

  if (!siteKey) {
    return (
      <div className={`tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700 dark:tw-border-red-500/40 dark:tw-bg-red-500/10 dark:tw-text-red-200 ${className}`}>
        reCAPTCHA is not configured. Please set the VITE_RECAPTCHA_SITE_KEY environment variable.
      </div>
    );
  }

  return (
    <div className={`tw-flex tw-justify-center ${className}`}>
      <ReCAPTCHA
        key={captchaTheme}
        ref={ref}
        sitekey={siteKey}
        onChange={onChange}
        onExpired={onExpired}
        theme={captchaTheme}
      />
    </div>
  );
});

RecaptchaField.displayName = 'RecaptchaField';

export default RecaptchaField;
