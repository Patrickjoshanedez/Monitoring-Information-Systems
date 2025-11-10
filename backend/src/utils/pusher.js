const Pusher = require('pusher');

let client = null;

const isConfigured = () => {
  return Boolean(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  );
};

const ensureClient = () => {
  if (!isConfigured()) {
    const error = new Error('Realtime chat service is not configured on the server.');
    error.code = 'PUSHER_NOT_CONFIGURED';
    throw error;
  }

  if (!client) {
    client = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return client;
};

const triggerEvent = async (channel, event, payload) => {
  try {
    const instance = ensureClient();
    await instance.trigger(channel, event, payload);
  } catch (error) {
    if (error.code === 'PUSHER_NOT_CONFIGURED') {
      throw error;
    }
  }
};

module.exports = {
  isConfigured,
  ensureClient,
  triggerEvent,
};
