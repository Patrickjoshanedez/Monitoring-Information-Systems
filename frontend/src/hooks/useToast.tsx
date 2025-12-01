import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ACCOUNT_DEACTIVATED_EVENT, DEFAULT_DEACTIVATED_MESSAGE } from '../shared/constants/accountStatus';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastOptions {
    message: string;
    variant?: ToastVariant;
    durationMs?: number;
    sticky?: boolean;
}

interface ToastContextValue {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ActiveToast = ToastOptions & { sticky?: boolean };

const variantClasses: Record<ToastVariant, string> = {
    success: 'tw-bg-emerald-50 tw-text-emerald-800 tw-border tw-border-emerald-200',
    error: 'tw-bg-red-50 tw-text-red-800 tw-border tw-border-red-200',
    info: 'tw-bg-blue-50 tw-text-blue-800 tw-border tw-border-blue-200',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ActiveToast | null>(null);
    const timerRef = useRef<number | undefined>(undefined);

    const showToast = useCallback(({ message, variant = 'info', durationMs = 4000, sticky = false }: ToastOptions) => {
        setToast({ message, variant, sticky });
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
        if (!sticky) {
            timerRef.current = window.setTimeout(() => {
                setToast(null);
                timerRef.current = undefined;
            }, durationMs);
        }
    }, []);

    useEffect(() => () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }
    }, []);

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ message?: string }>).detail;
            showToast({
                message: detail?.message || DEFAULT_DEACTIVATED_MESSAGE,
                variant: 'error',
                sticky: true
            });
        };
        window.addEventListener(ACCOUNT_DEACTIVATED_EVENT, handler);
        return () => window.removeEventListener(ACCOUNT_DEACTIVATED_EVENT, handler);
    }, [showToast]);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className={`tw-fixed tw-bottom-6 tw-right-6 tw-z-50 tw-rounded-2xl tw-shadow-lg tw-px-5 tw-py-4 tw-text-sm tw-font-medium tw-backdrop-blur tw-max-w-md tw-space-y-1 ${variantClasses[toast.variant ?? 'info']}`}
                >
                    <p>{toast.message}</p>
                    {toast.sticky && (
                        <p className="tw-text-xs tw-opacity-80">Please contact an administrator to regain access.</p>
                    )}
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
};
