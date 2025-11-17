const QRCode = require('qrcode');

const DEFAULT_QR_OPTIONS = {
    errorCorrectionLevel: 'H',
    margin: 1,
    scale: 6,
    color: {
        dark: '#1f2937',
        light: '#ffffffff',
    },
};

const generateQrDataUri = async (text, options = {}) => {
    if (!text) {
        throw new Error('QR payload is required');
    }
    const merged = { ...DEFAULT_QR_OPTIONS, ...options };
    return QRCode.toDataURL(text, merged);
};

module.exports = {
    generateQrDataUri,
};
