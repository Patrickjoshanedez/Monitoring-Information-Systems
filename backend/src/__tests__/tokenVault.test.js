process.env.CALENDAR_TOKEN_SECRET = process.env.CALENDAR_TOKEN_SECRET || 'unit-test-secret-1234567890!@#$';

const test = require('node:test');
const assert = require('node:assert/strict');

const tokenVault = require('../utils/tokenVault');

test('encryptSecret + decryptSecret round trip', () => {
  const original = 'refresh-token-value';
  const encrypted = tokenVault.encryptSecret(original);
  assert.ok(encrypted);
  assert.notStrictEqual(encrypted, original);
  const decrypted = tokenVault.decryptSecret(encrypted);
  assert.equal(decrypted, original);
});

test('decryptSecret returns null for invalid payloads', () => {
  assert.equal(tokenVault.decryptSecret(''), null);
  assert.equal(tokenVault.decryptSecret('@@not-base64@@'), null);
});
