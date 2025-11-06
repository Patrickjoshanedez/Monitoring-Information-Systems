import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

const client = axios.create({ baseURL: API_BASE });

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export type ProfilePayload = {
  displayName?: string;
  photoUrl?: string;
  bio?: string;
  education?: { program?: string; yearLevel?: string; major?: string };
  coursesNeeded?: string[];
  interests?: string[];
  learningGoals?: string;
  timezone?: string;
  contactPreferences?: Array<'email' | 'in_app' | 'sms'>;
  privacy?: Partial<{
    bio: 'public' | 'mentors' | 'private';
    education: 'public' | 'mentors' | 'private';
    interests: 'public' | 'mentors' | 'private';
    learningGoals: 'public' | 'mentors' | 'private';
    coursesNeeded: 'public' | 'mentors' | 'private';
    contact: 'public' | 'mentors' | 'private';
    photo: 'public' | 'mentors' | 'private';
    displayName: 'public' | 'mentors' | 'private';
  }>;
};

export const getMyProfile = async () => {
  const res = await client.get('/profile/me', { headers: authHeaders() });
  return res.data;
};

export const updateMyProfile = async (profile: ProfilePayload) => {
  const res = await client.patch('/profile/me', { profile }, { headers: authHeaders() });
  return res.data;
};

export const uploadPhoto = async (file: File) => {
  const form = new FormData();
  form.append('photo', file);
  const res = await client.post('/profile/photo', form, {
    headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
  });
  return res.data as { photoUrl: string };
};

export const getPublicProfile = async (id: string) => {
  const headers: any = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await client.get(`/profiles/${id}`, { headers });
  return res.data;
};
