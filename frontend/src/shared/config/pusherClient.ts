import Pusher from 'pusher-js';
import { API_BASE_URL } from './apiClient';

let client: Pusher | null = null;
let cachedToken: string | null = null;

export const getPusherClient = (): Pusher | null => {
  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;

  if (!key || !cluster) {
    return null;
  }

  const token = localStorage.getItem('token');

  if (client && cachedToken === token) {
    return client;
  }

  if (client) {
    client.disconnect();
    client = null;
  }

  cachedToken = token;
  const auth = token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : undefined;

  client = new Pusher(key, {
    cluster,
    forceTLS: true,
    authEndpoint: `${API_BASE_URL}/chat/pusher/auth`,
    auth,
  });

  return client;
};

export const disconnectPusher = () => {
  if (client) {
    client.disconnect();
    client = null;
    cachedToken = null;
  }
};
