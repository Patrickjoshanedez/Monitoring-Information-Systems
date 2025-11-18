# Mentoring System – Project Overview

## 1. Product Vision
- **Purpose:** A full MERN mentoring platform for BukSU that matches mentors and mentees, manages mentoring sessions, tracks progress/goals, and supports real-time collaboration.
- **Audience:** Admins (program coordinators), mentors (faculty/upperclass), and mentees (students) with role-based dashboards + approval workflows.
- **Experience Pillars:** secure onboarding (OTP + OAuth), guided applications, live chat + notifications, goal/progress tracking, downloadable certificates, and analytics-rich dashboards.

## 2. High-Level Architecture
| Layer | Stack | Notes |
| --- | --- | --- |
| Frontend | React 18 + Vite + TypeScript, Tailwind (strict `tw-` prefix), React Router v6, React Query, Zustand, Framer Motion | SPA hosted on Vite dev server (5173). Animations via `AnimatePresence`. Routing guarded with `<ProtectedRoute>` enforcing role + applicationStatus. Real-time updates through `pusher-js`. |
| Backend | Node 20 + Express 4, Mongoose 8, JWT + bcryptjs auth, Passport OAuth (Google/Facebook) | API server (`src/server.js`) uses CORS allowlist, Helmet CSP, compression, centralized JSON error handler, and a resilient MongoDB connection with retries/backoff and graceful shutdown. Background workers: `sessionReminderWorker`, `feedbackRetentionWorker`, `mentorFeedbackAggregationWorker`. |
| Realtime & Notifications | Pusher Channels, email via Nodemailer, in-app Notification model | `notificationService` fan-outs alerts; `chatController`/`ChatThread` deliver live conversations. |
| Storage & Assets | MongoDB Atlas (TLS enforced), Cloudinary for media uploads, local `/uploads` fallback | Multer-based upload middleware variants (`upload`, `uploadAvatar`, `uploadMaterial`). |

## 3. Frontend Structure & Conventions
- **Entry Points:** `src/main.tsx` hydrates `<App />` with Router + React Query providers. `App.tsx` wires all public/auth/dashboard routes and wraps them in `AnimatePresence` for smooth transitions.
- **Routing:** Landing pages (`pages/landingPages/*`), auth flows (`features/auth/pages`), role dashboards (`components/dashboards`), mentor/mentee page bundles, and admin review screens. Protected routes require role strings or arrays (e.g., `ProfileSettingsRoute` allows mentee/mentor) and optionally gate pending statuses.
- **UI Guidelines:**
  - Tailwind classes **must** use `tw-` prefix; no inline styles or external CSS beyond Tailwind pipeline.
  - Components follow 4-space indentation, 120-char limit, PropTypes (or TS types) + memoization for expensive renders.
  - Loading, empty, and error states are mandatory with accessible markup (aria attributes, keyboard focus styles).
- **State Management:**
  - Server data: React Query hooks with stable `queryKey`s, caching (5 min default), guarded retries (no retry on 4xx), and mutation optimism.
  - Client data: Zustand stores (`stores/*`) persisted via middleware, storing auth tokens + user profile, offering actions like `login`, `logout`, `updateUser`.
  - Feature flags through `VITE_FEATURE_*` envs and `import.meta.env` branches.
- **Testing & Quality:** Jest + React Testing Library config in `frontend/jest.config.cjs`; MSW for API mocking; ESLint + TypeScript typecheck scripts guard CI.

## 4. Backend Structure & Responsibilities
- **Server Boot (`src/server.js`):**
  - Configures CORS from `CLIENT_URLS`, JSON body parsing, cookies, Helmet CSP, compression, Passport strategies, `/health` probe, and static `/uploads` serving.
  - Registers modular routers: `authRoutes`, `applicationRoutes`, `mentorRoutes`, `adminRoutes`, `profileRoutes`, `sessionRoutes`, `/notifications`, `/announcements`, `materialRoutes`, `goalRoutes`, `progressRoutes`, `/chat`, `/mentorFeedback`, `/feedback`, `certificateRoutes`, `integrationRoutes`, `matchRoutes`.
  - Central error handler returns `{ success: false, error: 'SERVER_ERROR', message }` and logs sanitized stack traces via `utils/logger`.
  - Connects to MongoDB using `MONGODB_URI` with explicit modern options (`useNewUrlParser`, `useUnifiedTopology`, `serverSelectionTimeoutMS`, `retryWrites`, `appName`), connection event logging, and retry logic with exponential backoff for transient errors (e.g., ECONNRESET). Exits only after exhausting configurable retries (`MONGODB_CONNECT_RETRIES`, `MONGODB_CONNECT_BACKOFF_MS`) and performs graceful shutdown on SIGINT/SIGTERM.
- **Key Models (Mongoose):** `User`, `MentorshipRequest`, `Mentorship`, `MatchRequest`, `MatchAudit`, `Session`, `Goal`, `Progress`, `Notification`, `Announcement`, `Material`, `Certificate`, `Achievement`, `ChatThread`/`ChatMessage`, `Feedback`, `MentorFeedback`, `ProgressSnapshot`, `FeedbackAuditLog`, `FeedbackReviewTicket`, `AdminReviewTicket`, `AuditLog`, `Availability`, `BookingLock`. Indexes prioritize role/applicationStatus/createdAt for dashboards and review queues, plus session/availability indexes for scheduling.
- **Controllers:**
  - `authController` handles registration/login, OTP, OAuth callbacks, password resets, and JWT issuance.
  - `applicationController` manages mentee/mentor applications, status transitions, and admin approval workflows.
  - `sessionController` orchestrates booking, rescheduling, cancellations, reminder scheduling, post-session feedback capture (`SessionFeedback`), and session-linked chat creation via `ensureSessionChatThread` for both mentor-created sessions and mentee bookings.
  - `mentorController` exposes mentor directory filtering, profile updates, achievements, and availability settings.
  - `mentorFeedbackController` lets mentors submit structured feedback for completed sessions, exposes sanitized progress snapshots to mentees/admins, and records feedback audit logs.
  - `materialController` + `uploadMaterial` support lesson uploads backed by Cloudinary metadata.
  - `chatController` manages thread creation, participant policies, and message delivery (persist + Pusher broadcast).
  - `adminController`, `announcementController`, `certificateController`, `integrationController`, `matchController`, `feedbackController`, `goalController`, `progressController`, `notificationController` provide admin tooling, announcements, certificates, calendar integration, matchmaking, generic feedback, goals/progress, and notifications.
- **Middleware & Utilities:**
  - `middleware/auth.js` validates JWT, role gates, and applicationStatus requirements.
  - Upload middlewares enforce file type + size caps; `cloudinary.js` centralizes host config.
  - `utils/responses.js` standardizes `{ success, code, message }` structure; `notificationService` & `emailService` keep comms consistent; `recaptcha.js` validates tokens server-side only.
  - Background worker `sessionReminderWorker.js` polls upcoming sessions to dispatch notifications/email reminders.

## 5. Feature Overview & Flows
1. **Onboarding & Applications**
   - Users register via email/password, OAuth, or admin invite. reCAPTCHA (server-side secret) and email verification ensure integrity.
   - Role selection + multi-step application forms (mentor/mentee). Admin dashboards review submissions and set `applicationStatus` (pending, approved, rejected).
2. **Dashboards & Analytics**
   - Admin: pending approvals, platform metrics, announcement controls.
   - Mentor: upcoming sessions, mentee roster, goal tracking, material uploads, chat access.
   - Mentee: assigned mentor view, session schedule, progress/goal tracking, announcements feed.
3. **Sessions & Goals**
  - Mentors set availability; mentees request/reserve slots; reminders via worker + notifications.
  - Session booking paths:
    - Mentor-created sessions (`createMentorSession`) immediately create a `ChatThread` (type `session`) for all participants.
    - Mentees booking a session (`bookSession`) trigger `ensureSessionChatThread` so a shared chat space exists as soon as a booking is created; mentor booking notifications include `chatThreadId` for deep-links.
  - Progress + goal controllers allow CRUD with timeline visualizations (Recharts) on frontend.
4. **Communication & Notifications**
  - Real-time chat via Pusher + `ChatThread` (`direct` mentor–mentee chats and `session`-scoped group chats).
  - Notification routes push announcements, approvals, reminder alerts, match updates, mentor feedback events, and session-related changes; booking/confirmation payloads can include `chatThreadId` so the UI can open the right conversation.
  - Nodemailer handles email parity (HTML templates).
5. **Certificates & Achievements**
   - `certificateController` leverages `certificatePdf.js` (PDFKit) for downloadable completion certificates; goals/achievements recorded via dedicated models.
6. **Mentor–Mentee Matchmaking (MUS005)**
  - `MatchRequest`, `Mentorship`, and `MatchAudit` models capture ranked suggestions, decisions, and auditing metadata.
  - `matchService` scores mentees for each mentor (expertise overlap 50%, availability 25%, interactions 15%, priority 10%) and enforces mentor capacity.
    - Endpoints under `/api/mentors/:mentorId/match-suggestions`, `/api/mentees/:menteeId/match-suggestions`, `/api/matches/:id/(accept|decline|mentee-accept|mentee-decline)`, and `/api/matches/generate` supply dashboards, decision flows, and cron jobs.
  - Notifications (in-app + email) are fired for new suggestions, mentor responses, mentee confirmations, and mutual matches → which create `Mentorship` records and bump `mentorSettings.activeMenteesCount`.
    - Frontend pages `MentorMatchSuggestionsPage` (`/mentor/matches`) and `MenteeMatchSuggestionsPage` (`/mentee/matches`) surface ranked cards, profile modals/toasts, and status feeds powered by React Query hooks.
    - Admins can override mentor capacity via `/api/admin/mentors/capacity` + `/api/admin/mentors/:mentorId/capacity`, with UI controls embedded in `AdminDashboard`.

7. **Mentor Feedback & Progress Dashboard (MUS007)**
   - Mentors submit structured feedback for completed sessions via `mentorFeedbackController`; feedback is stored in `MentorFeedback` and linked to sessions and mentees.
   - `mentorFeedbackAggregationWorker` builds `ProgressSnapshot` documents per mentee, aggregating:
     - Average rating over time.
     - Monthly trend points.
     - Recent public comments and milestone metadata.
   - Mentees (and authorized admins) can query progress snapshots to power the mentee dashboard.
   - Backend ensures only completed/authorized sessions contribute to snapshots and audits all feedback changes via `FeedbackAuditLog`.
   - Frontend integrates this via `mentorFeedbackService` + React Query hook (`useProgressDashboard`), and `ProgressDashboard.tsx` renders:
     - Overall rating and trend line/table.
     - Recent mentor comments.
     - Goal and task completion stats combined with snapshot data.

## 6. Security, Privacy, and Compliance
- JWT auth with refresh handling on the server; tokens stored HTTP-only.
- Passport OAuth 2.0 for social login; per-role route guards on both FE and BE.
- Helmet CSP, compression, and sanitized logging; no secrets exposed client-side (env placeholders only).
- Server-side reCAPTCHA verification; upload sanitization + Cloudinary transformations.
- Consistent error shape `{ success: false, code, message }`; sensitive logs redacted.

## 7. Performance & Scalability Practices
- React-side code splitting via `React.lazy`/dynamic imports for heavy dashboards or editor panels.
- Vite `manualChunks` groups vendors (`react`, `@tanstack/*`, `framer-motion`).
- React Query caching + pagination/infinite scroll on large mentors/messaging lists; virtualization recommended (e.g., `react-window`).
- Backend indexes on `role`, `applicationStatus`, `createdAt`, `sessionDate` to accelerate queries; worker offloads reminder processing.
- Compression middleware + Cloudinary CDN for asset delivery.

## 8. Environment & Deployment
- **Frontend env:**
  - `VITE_API_URL`, `VITE_WS_URL`, `VITE_APP_NAME`, optional `VITE_SENTRY_DSN`, `VITE_ANALYTICS_ID`, feature flags `VITE_FEATURE_*`.
- **Backend env:**
  - `PORT`, `MONGODB_URI`, `CLIENT_URLS`, `JWT_SECRET`, OAuth client IDs/secrets, `PUSHER_APP_*`, `CLOUDINARY_*`, `SMTP_*`, `RECAPTCHA_SECRET`, `APP_NAME`.
- **Scripts:**
  - Frontend: `npm run dev/build/preview`, `lint`, `test`, `typecheck`.
  - Backend: `npm run dev` (nodemon), `start`, `seed:admin` (creates root admin user).
- **Deploy Targets:**
  - Backend suitable for Render/Fly with health endpoint + worker; frontend for Vercel/Netlify with API proxy to `/api`.

## 9. Developer Workflow & Quality Gates
1. **Branching & Commits:** follow `feat|fix|docs|style|refactor|test|chore: summary` format.
2. **Coding Standards:** 4-space indentation, 120-char limit, no `console.log` in prod, React components typed + documented, accessible interactions.
3. **Validation:**
   - Run `npm run lint`, `npm run typecheck`, and `npm run test` (frontend) before PRs;
   - Ensure backend passes integration smoke tests (e.g., Postman collection) and `seed:admin` when targeting new environments.
4. **Documentation:** Keep this overview + `DEPLOYMENT.md` updated with infrastructure notes; add ADRs for major architectural changes.

## 10. Next Steps / TODO Hooks
- Migrate remaining JS components to TypeScript + shared `shared/types` definitions.
- Expand automated tests (backend Jest or Supertest) for controllers and middleware.
- Implement feature flag-driven experiments (e.g., mentor suggestions) using `VITE_FEATURE_*` toggles.
- Add state-machine-driven flows for complex applications to reduce conditional sprawl.

> This document should be your single reference point for onboarding, architecture reviews, and future audits. Keep it versioned with the repo to ensure every contributor shares the same mental model of the Mentoring System.
