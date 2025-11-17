const test = require('node:test');
const assert = require('node:assert/strict');
const { generateCertificatePDF } = require('../utils/certificatePdf');
const { generateQrDataUri } = require('../utils/qr');

const sampleCertificate = {
    serialNumber: 'MNT-TEST-000001',
    certificateType: 'completion',
    programName: 'Unit Test Program',
    issuedAt: new Date('2024-01-01T00:00:00.000Z'),
    metadata: {
        signedBy: 'QA Director',
        signerTitle: 'Quality Lead',
    },
};

const sampleMetrics = {
    completedSessions: 4,
    totalHours: 6,
    goalsCompleted: 2,
};

test('generateCertificatePDF returns a non-empty PDF buffer', async () => {
    const qr = await generateQrDataUri('https://example.com/verify/unit-test');
    const buffer = await generateCertificatePDF({
        certificate: sampleCertificate,
        mentee: { fullName: 'Test Learner' },
        mentor: { fullName: 'Test Mentor', title: 'Mentor' },
        metrics: sampleMetrics,
        qrDataUri: qr,
        brand: { primary: '#22d3ee', accent: '#0ea5e9' },
    });
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 5000, 'Expected certificate PDF to have content');
});
