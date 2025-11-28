# Third-Party Integrations

This document outlines the third-party APIs and services integrated into the Mentoring System.

## Authentication & Identity

### Google OAuth 2.0
*   **Purpose**: Allows users to sign in using their Google accounts.
*   **Implementation**: `backend/src/config/passport.js`
*   **Package**: `passport-google-oauth20`
*   **Environment Variables**:
    *   `GOOGLE_CLIENT_ID`
    *   `GOOGLE_CLIENT_SECRET`
    *   `SERVER_URL` (for callback construction)

### Facebook OAuth
*   **Purpose**: Allows users to sign in using their Facebook accounts.
*   **Implementation**: `backend/src/config/passport.js`
*   **Package**: `passport-facebook`
*   **Environment Variables**:
    *   `FACEBOOK_APP_ID` (implied)
    *   `FACEBOOK_APP_SECRET` (implied)

## Storage & Media

### Cloudinary
*   **Purpose**: Cloud storage for user uploads, including profile photos and mentoring materials.
*   **Implementation**: `backend/src/utils/cloudinary.js`
*   **Package**: `cloudinary`
*   **Environment Variables**:
    *   `CLOUDINARY_CLOUD_NAME`
    *   `CLOUDINARY_API_KEY`
    *   `CLOUDINARY_API_SECRET`
    *   `CLOUDINARY_URL` (optional alternative)

### Google Drive API
*   **Purpose**: Integration for handling specific document storage needs or backups.
*   **Implementation**: `backend/src/utils/gdriveService.js`
*   **Package**: `googleapis`
*   **Environment Variables**:
    *   `GOOGLE_DRIVE_CLIENT_ID`
    *   `GOOGLE_DRIVE_CLIENT_SECRET`
    *   `GOOGLE_DRIVE_REDIRECT_URI`
    *   `GOOGLE_DRIVE_REFRESH_TOKEN`

## Communication & Real-time

### Pusher
*   **Purpose**: Powers real-time features such as instant chat messaging and live notifications.
*   **Implementation**: `backend/src/utils/pusher.js`
*   **Package**: `pusher`
*   **Environment Variables**:
    *   `PUSHER_APP_ID`
    *   `PUSHER_KEY`
    *   `PUSHER_SECRET`
    *   `PUSHER_CLUSTER`

### SMTP (Gmail)
*   **Purpose**: Sending transactional emails for password resets, account verification, and system notifications.
*   **Implementation**: `backend/src/utils/emailService.js`
*   **Package**: `nodemailer`
*   **Environment Variables**:
    *   `GMAIL_USER`
    *   `GMAIL_PASS`

## Productivity & Tools

### Google Calendar API
*   **Purpose**: Syncing mentoring sessions with the user's personal Google Calendar.
*   **Implementation**: `backend/src/services/googleCalendarService.js`
*   **Package**: `googleapis`
*   **Environment Variables**:
    *   `GOOGLE_CALENDAR_CLIENT_ID`
    *   `GOOGLE_CALENDAR_CLIENT_SECRET`
    *   `GOOGLE_CALENDAR_STATE_SECRET`
    *   `GOOGLE_CALENDAR_REDIRECT_URI`

### Google reCAPTCHA
*   **Purpose**: Protecting public forms (like registration) from bot traffic.
*   **Implementation**: `backend/src/utils/recaptcha.js`
*   **Method**: Direct REST API call via `node-fetch`.
*   **Environment Variables**:
    *   `RECAPTCHA_SECRET_KEY`
