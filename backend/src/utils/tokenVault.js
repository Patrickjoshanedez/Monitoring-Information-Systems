const crypto = require('crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended length for GCM
const AUTH_TAG_LENGTH = 16;

let cachedKey = null;
let cachedSecret = null;

const getSecret = () => process.env.CALENDAR_TOKEN_SECRET;

const deriveKey = () => {
  const secret = getSecret();
  if (!secret || secret.length < 16) {
    cachedKey = null;
    cachedSecret = null;
    return null;
  }

  if (secret !== cachedSecret) {
    cachedSecret = secret;
    cachedKey = crypto.createHash('sha256').update(secret).digest();
  }

  return cachedKey;
};

const ensureKey = () => {
  const key = deriveKey();
  if (!key) {
    const error = new Error('CALENDAR_TOKEN_SECRET is not configured or too short');
    error.code = 'CALENDAR_TOKEN_SECRET_MISSING';
    throw error;
  }
  return key;
};

const encryptSecret = (plainText) => {
  if (!plainText) {
    return null;
  }

  const key = ensureKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decryptSecret = (payload) => {
  if (!payload) {
    return null;
  }

  const key = deriveKey();
  if (!key) {
    logger.error('CALENDAR_TOKEN_SECRET missing; cannot decrypt stored refresh token.');
    return null;
  }

  try {
    const buffer = Buffer.from(payload, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Failed to decrypt Google token:', error.message || error);
    return null;
  }
};

const isTokenSecretConfigured = () => Boolean(deriveKey());

module.exports = {
  encryptSecret,
  decryptSecret,
  isTokenSecretConfigured,
};
