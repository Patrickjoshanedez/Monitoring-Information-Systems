const EVENT_NAME = 'account:deactivated';
export const ACCOUNT_DEACTIVATED_EVENT = EVENT_NAME;
export const DEFAULT_DEACTIVATED_MESSAGE = 'Your account has been deactivated. Only an administrator can reactivate it.';

interface DeactivatedDetail {
    message?: string;
}

export const dispatchAccountDeactivated = (message?: string) => {
    try {
        localStorage.setItem('accountStatus', 'deactivated');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    } catch (error) {
        // Ignore storage failures; toast still fires via event.
    }

    const detail: DeactivatedDetail = { message: message || DEFAULT_DEACTIVATED_MESSAGE };
    window.dispatchEvent(new CustomEvent<DeactivatedDetail>(EVENT_NAME, { detail }));
};
