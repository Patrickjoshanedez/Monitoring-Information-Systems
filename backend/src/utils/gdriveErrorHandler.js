const logger = require('./logger');

const STATUS_ERROR_CODE_MAP = {
  403: 'GOOGLE_DRIVE_PERMISSION_DENIED',
  404: 'GOOGLE_DRIVE_FILE_NOT_FOUND',
  413: 'GOOGLE_DRIVE_FILE_TOO_LARGE',
  500: 'GOOGLE_DRIVE_SERVICE_UNAVAILABLE',
};

const CUSTOM_ERROR_CODE_MAP = {
  FILE_TOO_LARGE: 'GOOGLE_DRIVE_FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'GOOGLE_DRIVE_UNSUPPORTED_FILE_TYPE',
  NO_FILE: 'GOOGLE_DRIVE_NO_FILE',
};

const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

const toAppErrorCode = (err) => {
  if (!err) return NETWORK_ERROR_CODE;

  const status = err.status || err.response?.status;
  if (status && STATUS_ERROR_CODE_MAP[status]) {
    return STATUS_ERROR_CODE_MAP[status];
  }

  if (err.code && CUSTOM_ERROR_CODE_MAP[err.code]) {
    return CUSTOM_ERROR_CODE_MAP[err.code];
  }

  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
    return NETWORK_ERROR_CODE;
  }

  return 'GOOGLE_DRIVE_UNKNOWN_ERROR';
};

const toUserMessage = (code) => {
  switch (code) {
    case 'GOOGLE_DRIVE_PERMISSION_DENIED':
      return 'You do not have permission to access Google Drive for this operation.';
    case 'GOOGLE_DRIVE_FILE_NOT_FOUND':
      return 'The requested file could not be found in Google Drive.';
    case 'GOOGLE_DRIVE_FILE_TOO_LARGE':
      return 'The selected file is too large to upload.';
    case 'GOOGLE_DRIVE_UNSUPPORTED_FILE_TYPE':
      return 'This file type is not supported. Please upload a different format.';
    case 'GOOGLE_DRIVE_NO_FILE':
      return 'No file was detected in the request. Please attach at least one file.';
    case 'GOOGLE_DRIVE_SERVICE_UNAVAILABLE':
      return 'Google Drive is temporarily unavailable. Please try again later.';
    case NETWORK_ERROR_CODE:
      return 'Network error while communicating with Google Drive. Please check your connection and try again.';
    default:
      return 'An unexpected error occurred while working with Google Drive.';
  }
};

const logDriveError = (context, err) => {
  const safeContext = typeof context === 'string' ? { context } : context || {};
  const payload = {
    ...safeContext,
    message: err?.message,
    status: err?.status || err?.code || err?.response?.status,
    details: err?.response?.data?.error?.message || err?.response?.data?.error || err?.response?.data,
  };
  logger.error('Google Drive error', payload);
};

module.exports = {
  toAppErrorCode,
  toUserMessage,
  logDriveError,
  NETWORK_ERROR_CODE,
};
