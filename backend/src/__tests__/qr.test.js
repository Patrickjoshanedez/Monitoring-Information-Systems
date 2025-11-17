const test = require('node:test');
const assert = require('node:assert/strict');
const { generateQrDataUri } = require('../utils/qr');

test('generateQrDataUri produces data URI string', async () => {
    const dataUri = await generateQrDataUri('qr:test:payload');
    assert.ok(typeof dataUri === 'string');
    assert.ok(dataUri.startsWith('data:image/png;base64,'));
});
