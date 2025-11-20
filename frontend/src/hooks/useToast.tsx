import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastOptions {
    message: string;
    variant?: ToastVariant;
    durationMs?: number;
}

interface ToastContextValue {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantClasses: Record<ToastVariant, string> = {
    success: 'tw-bg-emerald-50 tw-text-emerald-800 tw-border tw-border-emerald-200',
    error: 'tw-bg-red-50 tw-text-red-800 tw-border tw-border-red-200',
    info: 'tw-bg-blue-50 tw-text-blue-800 tw-border tw-border-blue-200',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastOptions | null>(null);

    const showToast = useCallback(({ message, variant = 'info', durationMs = 4000 }: ToastOptions) => {
        setToast({ message, variant });
        window.clearTimeout((showToast as any)._timer);
        (showToast as any)._timer = window.setTimeout(() => {
            setToast(null);
        }, durationMs);
    }, []);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`tw-fixed tw-bottom-6 tw-right-6 tw-z-50 tw-rounded-2xl tw-shadow-lg tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-backdrop-blur ${variantClasses[toast.variant ?? 'info']}`}
                >
                    {toast.message}
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
