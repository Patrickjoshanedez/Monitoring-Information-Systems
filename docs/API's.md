# Mentoring System API Documentation

## Backend Dependencies
Based on `backend/package.json`:

| Category | Package | Version |
|----------|---------|---------|
| **Core** | express | ^4.19.2 |
| | mongoose | ^8.7.1 |
| | dotenv | ^16.4.5 |
| **Security** | helmet | ^8.1.0 |
| | cors | ^2.8.5 |
| | express-rate-limit | ^7.1.5 |
| **Auth** | passport | ^0.7.0 |
| | jsonwebtoken | ^9.0.2 |
| | bcryptjs | ^2.4.3 |
| **File/Media** | multer | ^2.0.2 |
| | cloudinary | ^1.41.3 |
| | pdfkit | ^0.17.2 |
| **Communication** | pusher | ^5.1.2 |
| | nodemailer | ^6.9.13 |
| **Utils** | luxon | ^3.5.0 |
| | qrcode | ^1.5.4 |

## API Endpoints
Base URL: `/api`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/set-password` | Set initial password |
| GET | `/auth/google` | Google OAuth initiation |
| GET | `/auth/facebook` | Facebook OAuth initiation |
| GET | `/auth/debug` | Debug auth state |
| POST | `/auth/refresh-token` | Refresh JWT token |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/verify-email` | Verify email address |
| POST | `/auth/resend-verification` | Resend verification email |
| POST | `/auth/check-status` | Check current auth status |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mentee/application/submit` | Submit mentee application |
| GET | `/mentee/application/status` | Get mentee application status |
| POST | `/mentor/application/submit` | Submit mentor application |
| GET | `/mentor/application/status` | Get mentor application status |
| GET | `/admin/applications` | List all applications (Admin) |
| PATCH | `/admin/applications/:userId/approve` | Approve application |
| PATCH | `/admin/applications/:userId/reject` | Reject application |
| GET | `/admin/applications/stats` | Application statistics |

### Mentors & Mentorship
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mentors` | List mentors |
| GET | `/mentor/mentees` | List mentees for a mentor |
| GET | `/mentorship/requests` | Get mentorship requests |
| POST | `/mentorship/requests` | Create mentorship request |
| PATCH | `/mentorship/requests/:id/accept` | Accept request |
| PATCH | `/mentorship/requests/:id/decline` | Decline request |
| PATCH | `/mentorship/requests/:id/withdraw` | Withdraw request |
| GET | `/mentors/:mentorId/availability` | Get mentor availability |
| POST | `/mentors/:mentorId/availability` | Set availability |
| PATCH | `/mentors/:mentorId/availability/:availabilityId` | Update availability |
| DELETE | `/mentors/:mentorId/availability/:availabilityId` | Delete availability |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/mentors/capacity` | Check mentor capacity |
| PATCH | `/admin/mentors/:mentorId/capacity` | Update mentor capacity |
| GET | `/admin/matching/pairings` | List match pairings |
| GET | `/admin/matching/pairings/:pairingId` | Get pairing details |
| PATCH | `/admin/matching/pairings/:pairingId` | Update pairing |
| GET | `/admin/users` | List all users |
| GET | `/admin/users/:userId` | Get user details |
| POST | `/admin/users/:userId/actions` | Perform admin action on user |
| PATCH | `/admin/users/:userId/role` | Update user role |
| GET | `/admin/sessions` | List all sessions |
| PATCH | `/admin/sessions/:sessionId/review` | Review session |
| POST | `/admin/notifications` | Send system notification |
| GET | `/admin/notifications/logs` | View notification logs |
| GET | `/admin/feedback/mentor` | Get mentor feedback |
| GET | `/admin/feedback/mentor/summary` | Feedback summary |
| GET | `/admin/feedback/mentor/export` | Export feedback |
| PATCH | `/admin/feedback/mentor/:feedbackId/moderation` | Moderate feedback |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/me` | Get current user profile |
| PATCH | `/profile/me` | Update profile |
| POST | `/profile/photo` | Upload profile photo |
| DELETE | `/profile/photo` | Remove profile photo |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sessions` | List sessions |
| POST | `/sessions` | Create session |
| POST | `/sessions/lock` | Lock session slot |
| GET | `/sessions/:id` | Get session details |
| PATCH | `/sessions/:id/confirm` | Confirm session |
| PATCH | `/sessions/:id/reschedule` | Reschedule session |
| PATCH | `/sessions/:id/cancel` | Cancel session |
| POST | `/sessions/:id/attendance` | Mark attendance |
| GET | `/mentor/sessions` | Get mentor sessions |
| POST | `/mentor/sessions` | Create mentor session |
| GET | `/sessions/report` | Session report |
| GET | `/sessions/export` | Export session data |
| PATCH | `/sessions/:id/complete` | Complete session |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/` | Get notifications |
| PATCH | `/notifications/read-all` | Mark all read |
| PATCH | `/notifications/:id/read` | Mark one read |
| GET | `/notifications/preferences` | Get preferences |
| PUT | `/notifications/preferences` | Update preferences |

### Announcements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/announcements/` | List announcements |
| POST | `/announcements/` | Create announcement |
| PATCH | `/announcements/:id` | Update announcement |
| DELETE | `/announcements/:id` | Delete announcement |

### Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/materials/upload` | Upload material |
| GET | `/materials/mentee` | Get mentee materials |
| GET | `/materials/mentor` | Get mentor materials |
| GET | `/materials/:materialId/preview` | Preview material |
| DELETE | `/materials/:materialId` | Delete material |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/goals` | Create goal |
| GET | `/goals` | List goals |
| PATCH | `/goals/:id/progress` | Update goal progress |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/progress-dashboard` | Get progress dashboard data |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chat/threads` | List chat threads |
| POST | `/chat/threads` | Create chat thread |
| GET | `/chat/threads/:threadId/messages` | Get messages |
| POST | `/chat/threads/:threadId/messages` | Send message |
| POST | `/chat/threads/:threadId/read` | Mark thread read |
| POST | `/chat/upload` | Upload chat attachment |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/:sessionId/mentor-feedback` | Submit mentor feedback |
| PUT | `/sessions/:sessionId/mentor-feedback` | Update mentor feedback |
| GET | `/sessions/:sessionId/mentor-feedback` | Get mentor feedback |
| GET | `/mentor-feedback/progress` | Get feedback progress |
| GET | `/mentor-feedback/mentees/:menteeId/progress` | Get mentee progress |
| GET | `/mentor-feedback/:feedbackId/audit` | Audit feedback |
| POST | `/sessions/:sessionId/feedback` | Submit session feedback |
| PUT | `/sessions/:sessionId/feedback` | Update session feedback |
| GET | `/sessions/:sessionId/feedback` | Get session feedback |
| GET | `/feedback/pending` | Get pending feedback |
| POST | `/feedback/:feedbackId/flag` | Flag feedback |
| GET | `/mentors/:mentorId/feedback-summary` | Mentor feedback summary |
| GET | `/feedback/admin/review-tickets` | Admin review tickets |
| PATCH | `/feedback/admin/review-tickets/:ticketId/resolve` | Resolve ticket |
| GET | `/feedback/admin/:feedbackId/raw` | Get raw feedback |

### Certificates & Achievements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/certificates/issue` | Issue certificate |
| GET | `/certificates` | List certificates |
| GET | `/certificates/:id` | Get certificate details |
| GET | `/achievements` | List achievements |
| POST | `/achievements/trigger` | Trigger achievement |
| GET | `/certificates/:id/download` | Download certificate |
| POST | `/certificates/:id/reissue-request` | Request reissue |
| POST | `/admin/certificates/:id/reissue` | Admin reissue |

### Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/integrations/google-calendar/auth` | Auth Google Calendar |
| GET | `/integrations/google-calendar/auth-url` | Get Auth URL |
| POST | `/integrations/google-calendar/callback` | Auth Callback |
| DELETE | `/integrations/google-calendar` | Disconnect Calendar |

### Matching
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mentors/:mentorId/match-suggestions` | Get suggestions for mentor |
| GET | `/mentors/:mentorId/match-suggestions/:matchId` | Get specific suggestion |
| GET | `/mentors/:mentorId/matches` | Get mentor matches |
| GET | `/mentees/:menteeId/match-suggestions` | Get suggestions for mentee |
| GET | `/mentees/:menteeId/matches` | Get mentee matches |
| POST | `/matches/:id/accept` | Accept match |
| POST | `/matches/:id/decline` | Decline match |
| POST | `/matches/:id/mentee-accept` | Mentee accept match |
| POST | `/matches/:id/mentee-decline` | Mentee decline match |
| POST | `/matches/generate` | Generate matches |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/admin/overview` | Admin report overview |
| GET | `/reports/admin/export` | Export admin report |
