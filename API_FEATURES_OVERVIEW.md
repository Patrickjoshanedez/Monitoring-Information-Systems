# Mentoring System – API, Feature, and Workflow Reference

**Last updated:** November 22, 2025

## 1. Platform Feature Snapshot

| Area | Highlights |
| --- | --- |
| **Onboarding & Roles** | Email/password + OAuth (Google/Facebook), OTP verification, mentor/mentee application review, admin invites, role + applicationStatus gating on every API and route. |
| **Scheduling & Sessions** | Mentor-set availability, mentee booking/rescheduling, attendance tracking, reminder worker, session-specific chat threads, downloadable summaries. |
| **Mentor Feedback & Progress (MUS007)** | Structured ratings/comments per session, audit logs, aggregation worker building `ProgressSnapshot` (avg rating, trend, milestones, recent comments) for mentee dashboards and profile drawers. |
| **Matchmaking (MUS005)** | Multi-factor scoring (expertise, availability, interactions, priority), suggestion feeds for mentors/mentees, acceptance/decline flows that convert into `Mentorship` records plus audit trails and notifications. |
| **Goals, Materials, Certificates** | CRUD for goals/progress markers, resource uploads via Cloudinary, PDF certificates via PDFKit. |
| **Realtime Comms & Notifications** | `ChatThread` + `ChatMessage` with Pusher, in-app notifications + email parity (session changes, matches, mentor feedback, announcements). |
| **Administration & Analytics** | Admin dashboards for approvals, platform metrics, announcements, mentor capacity overrides, audit log access, seeds/scripts for bootstrapping data. |

## 2. Core Workflows

### 2.1 Onboarding & Application Review

1. User registers (email/password) or authenticates via OAuth.
2. Completes mentor/mentee application form; status set to `pending`.
3. Admin reviews via `/api/applications` endpoints, sets `applicationStatus` (approved/rejected) and optionally sends notifications.
4. Approved users gain access to their dashboards; pending users see guidance via guarded frontend routes (React Router keeps them on status screens).

### 2.2 Mentor–Mentee Matchmaking Loop

1. Mentees submit preferences; mentors set capacity via `mentorRoutes`.
2. Cron or admin triggers `/api/matches/generate`, invoking matching service.
3. Mentors receive suggestion cards (`GET /api/mentors/:mentorId/match-suggestions`) and respond (accept/decline) per suggestion.
4. Mentees confirm matches (`/api/matches/:id/mentee-accept`); mutual acceptance creates `Mentorship` + audit log + notifications. Capacity counters update automatically.
5. Admin controls can override capacity (`/api/admin/mentors/:mentorId/capacity`) and inspect match audits.

### 2.3 Session Lifecycle

1. Mentor publishes availability (`PUT /api/mentor/availability`).
2. Mentees browse slots (`GET /api/sessions/available`) and book (`POST /api/sessions`). Mentor-created sessions use `/api/mentor/sessions`.
3. Booking triggers `ensureSessionChatThread`, push notification, and reminder scheduling. All flows include `chatThreadId` in the payload so the frontend can jump into conversations.
4. Session completion collects attendance + notes; mentors submit session or mentor feedback (see next workflow). Workers send reminders and escalate incomplete feedbacks if needed.

### 2.4 Mentor Feedback → Progress Dashboard (MUS007)

1. After a session with status `completed`, mentor posts ratings/comments via `/api/sessions/:sessionId/mentor-feedback`.
2. `MentorFeedback` doc stores raw + sanitized comment; audit log records action; mentee notified.
3. `mentorFeedbackAggregationWorker` updates the mentee’s `ProgressSnapshot` (avg rating, trend, milestones, recent comments).
   - Endpoint `/api/mentor-feedback/progress` returns the signed-in mentee’s snapshot.
   - `/api/mentor-feedback/mentees/:menteeId/progress` is available to admins, the mentee, and mentors with a session relationship.
4. Frontend renders data in `ProgressDashboard` and `MenteeProfileDrawer`, respecting comment visibility (public vs private) and viewer role.

### 2.5 Communication & Notifications

1. Every session or booking action calls `notificationController` to fan out in-app + email alerts.
2. `chatRoutes` expose thread list, message posting, and read receipts. Frontend uses Pusher to stream updates.
3. Announcements, match events, feedback submissions, and certificate availability all emit notifications with contextual payloads (IDs, thread links, etc.).

## 3. Backend API Surface (by Router)

> **Base URL:** All endpoints are served under `/api`. Every route enforces JWT auth via `authenticate` middleware and applies role/applicationStatus checks inside controllers.

| Router File | Base Path(s) | Notable Endpoints / Purpose |
| --- | --- | --- |
| `authRoutes.js` | `/auth` | `/login`, `/register`, `/refresh`, `/logout`, `/oauth/google`, `/otp/verify`, `/password/reset`. Manages credentials, tokens, and OAuth callbacks. |
| `applicationRoutes.js` | `/applications` | CRUD for mentee/mentor applications, admin review actions, status transitions, supporting documents upload. |
| `mentorRoutes.js` | `/mentor` | Profile & expertise updates, availability slots (`PUT /availability`), achievements, mentor directory filters, capacity settings. |
| `menteeRoutes` _(handled inside `progressRoutes` & `sessionRoutes`)_ | `/mentee` | Dashboard datasets (goals, progress, assigned mentors) and limited profile editing. |
| `sessionRoutes.js` | `/sessions` | List availability, book/reschedule/cancel sessions, mark attendance, fetch history; mentors have privileged endpoints under `/mentor/sessions`. |
| `goalRoutes.js` & `progressRoutes.js` | `/goals`, `/progress` | CRUD for goals/milestones and aggregated progress tracking separate from mentor feedback snapshots. |
| `mentorFeedbackRoutes.js` | `/sessions/:sessionId/mentor-feedback`, `/mentor-feedback/*` | Submit/update/view mentor feedback, fetch mentee snapshots, audit logs. Rate-limited. |
| `feedbackRoutes.js` | `/feedback` | General platform feedback (non-session-specific), often surfaced in admin dashboards. |
| `matchRoutes.js` | `/matches` | Generate suggestions, list mentor/mentee queues, accept/decline flows, admin capacity overrides, audits. |
| `chatRoutes.js` | `/chat` | Manage threads (`GET /threads`, `POST /threads/:id/messages`), presence, and attachments; integrates with Pusher notifications. |
| `notificationRoutes.js` | `/notifications` | Fetch unread notifications, mark-as-read, preferences toggles. |
| `announcementRoutes.js` | `/announcements` | Admin-created announcement CRUD; visible in dashboards and optionally emailed. |
| `materialRoutes.js` | `/materials` | Upload/list/delete mentor resources using specialized multer config + Cloudinary metadata. |
| `certificateRoutes.js` | `/certificates` | Generate/download certificates of completion using PDFKit, verifying mentorship/session completion. |
| `profileRoutes.js` | `/profile` | `GET /me`, `PUT /me`, avatar upload webhook, `GET /:id` (public profile with privacy filtering + optional progress snapshot for self). |
| `adminRoutes.js` | `/admin` | Program-level analytics, mentor capacity overrides, audit log access, user management helpers. |
| `integrationRoutes.js` | `/integrations` | Calendar or LMS integrations (e.g., `POST /google/sync`), token exchanges, webhook handlers. |

## 4. Frontend Route Map (React Router)

| Path | Component / Feature | Notes |
| --- | --- | --- |
| `/` | Landing + marketing sections | Public pages with CTA to apply/login. |
| `/auth/*` | Auth flows (`LoginPage`, `RegisterPage`, OTP, Forgot Password) | Uses React Query mutations + Toast notifications. |
| `/mentee/*` | Mentee dashboard, session list, goals, mentor profile drawer | Protected by `ProtectedRoute` requiring role `mentee` + approved status. |
| `/mentor/*` | Mentor dashboard, availability planner, match suggestions | Includes `MentorSessionsManager`, `MentorMatchSuggestionsPage`. |
| `/admin/*` | Admin review, announcements, analytics | Requires `admin` role; features data tables with server pagination. |
| `/chat/:threadId` | Chat workspace | Connects to Pusher channel + REST fallback. |
| `/profile` | Profile settings page | Shared between mentor/mentee with conditional sections. |
| `/applications/status` | Pending/Rejected applicants status page | Guides users to wait or resubmit. |

All routes load data through domain-specific hooks under `frontend/src/hooks` using React Query (stable keys + caching). Components enforce accessibility (aria labels, focus states) and display loading, empty, and error states per the project conventions.

## 5. Testing, Observability, and Evaluation Hooks

- **Frontend:** Jest + RTL suites (see `src/components/mentor/__tests__/*`, `src/components/mentee/__tests__/*`). Playwright sample under `evaluation/frontend-e2e` for MUS007 UI verification.
- **Backend:** Node `--test` suites using `mongodb-memory-server` for isolation (e.g., `mus007-feedback-to-progress.test.js`, `profile-progress.test.js`).
- **Tracing:** `backend/src/tracing.js` + `frontend/src/tracing.ts` send OTLP traces to `devops/tracing` collector/Jaeger for debugging cross-service workflows (mentor feedback and session flows).
- **Evaluation:** `evaluation/api/evaluate-feedback.js` performs smoke checks on mentor-feedback APIs. `evaluation/agent/run-eval.js` scaffolds automated judge loops for MUS007 acceptance criteria.

## 6. How to Use This Reference

1. **Need to expose a new capability?** Identify the closest router above, add endpoints following the controller + response conventions (`ok()/fail()` helpers) and document them here.
2. **Updating a workflow?** Trace the numbered steps in Section 2 to understand existing side-effects (notifications, chat threads, workers) before modifying behavior.
3. **Frontend integration** follows the route map and React Query patterns. Add new hooks/services mirroring backend endpoints and update the relevant dashboard/components with proper state handling.

Keeping this file current ensures every contributor can reason about the platform surface area without diving into each router file. Update it whenever you add or change public APIs, major features, or workflows.
