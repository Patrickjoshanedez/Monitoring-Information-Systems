const cloudinary = require('cloudinary').v2;

let configured = false;

const hasBasicConfig = () => {
    if (process.env.CLOUDINARY_URL) {
        return true;
    }
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

const ensureConfigured = () => {
    if (configured) {
        return true;
    }
    if (!hasBasicConfig()) {
        return false;
    }

    if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ secure: true });
    } else {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });
    }
    configured = true;
    return true;
};

const uploadBuffer = async (buffer, options) => {
    if (!ensureConfigured()) {
        const error = new Error('Cloudinary is not configured; set CLOUDINARY credentials on the server.');
        error.code = 'CLOUDINARY_NOT_CONFIGURED';
        throw error;
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        });
        stream.end(buffer);
    });
};

const deleteAsset = async (publicId, resourceType) => {
    if (!publicId) {
        return;
    }
    if (!ensureConfigured()) {
        const error = new Error('Cloudinary is not configured; cannot delete asset.');
        error.code = 'CLOUDINARY_NOT_CONFIGURED';
        throw error;
    }
    await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType || 'raw',
    });
};

module.exports = {
    cloudinary,
    ensureConfigured,
    uploadBuffer,
    deleteAsset,
};
