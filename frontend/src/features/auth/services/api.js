import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_BASE, withCredentials: true });

export const register = (data) => api.post('/auth/register', data).then(r => r.data);
export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data).then(r => r.data);
export const resetPassword = (token, data) => api.post(`/auth/reset-password/${token}`, data).then(r => r.data);

export const googleOAuthUrl = () => `${API_BASE}/auth/google`;

export const mapErrorCodeToMessage = (code) => {
  switch (code) {
    case 'INVALID_CREDENTIALS': return 'Invalid email or password.';
    case 'EMAIL_EXISTS': return 'An account with this email already exists.';
    case 'ACCOUNT_LOCKED': return 'Account locked due to failed attempts. Try again later.';
    case 'INVALID_TOKEN': return 'Invalid or expired token.';
    default: return 'Network error. Please try again.';
  }
};


