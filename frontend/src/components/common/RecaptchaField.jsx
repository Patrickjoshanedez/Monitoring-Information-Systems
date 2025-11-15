import React, { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

/**
 * @typedef {Object} RecaptchaFieldProps
 * @property {(token: string | null) => void} [onChange]
 * @property {() => void} [onExpired]
 * @property {string} [className]
 */

// Use env site key if provided; otherwise in non-production fall back to Google's public test key.
// This avoids the common "Invalid domain for site key" blocker during local dev.
const MODE = import.meta.env.MODE;
const DEV_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Public test key from Google docs
const resolvedSiteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY || (MODE !== 'production' ? DEV_TEST_SITE_KEY : '');

const RecaptchaField = forwardRef(
    /** @type {React.ForwardRefRenderFunction<ReCAPTCHA, RecaptchaFieldProps>} */
    ({ onChange, onExpired, className = '' }, ref) => {
    if (!resolvedSiteKey) {
        return (
            <div
                className={`tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700 ${className}`}
                role="alert"
                aria-live="polite"
            >
                reCAPTCHA is not configured. Please set the VITE_RECAPTCHA_SITE_KEY environment variable.
            </div>
        );
    }

    return (
        <div className={`tw-flex tw-flex-col tw-items-center ${className}`}>
            {resolvedSiteKey === DEV_TEST_SITE_KEY && (
                <p className="tw-mb-2 tw-text-xs tw-text-amber-700 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded tw-px-2 tw-py-1" aria-live="polite">
                    Using Google reCAPTCHA test key (dev only). Complete the widget to proceed.
                </p>
            )}
            <ReCAPTCHA ref={ref} sitekey={resolvedSiteKey} onChange={onChange} onExpired={onExpired} theme="light" />
        </div>
    );
});

RecaptchaField.displayName = 'RecaptchaField';

export default RecaptchaField;
