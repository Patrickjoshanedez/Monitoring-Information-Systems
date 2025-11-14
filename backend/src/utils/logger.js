const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    info: (...args) => {
        if (!isProd) {
            // Allowed in dev only
            console.log(...args);
        }
    },
    warn: (...args) => {
        if (!isProd) {
            console.warn(...args);
        }
    },
    error: (...args) => {
        // Errors are logged in all environments
        console.error(...args);
    },
};
