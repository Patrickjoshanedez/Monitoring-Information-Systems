# Implementation Plan — Mentor Feedback & Progress Tracking

**Last updated:** 2025-11-22

This implementation-level plan documents the work required to add structured mentor feedback and progress-tracking to the platform. It is written for engineers, QA, and product owners and includes schema examples, API contracts, UI integration points, acceptance criteria, tests to add, and a prioritized developer checklist.

---

## 1. Goals & acceptance criteria

- Enable mentors to submit structured feedback (rating + optional comment + competencies) for completed sessions.
- Persist feedback in a dedicated, indexed collection linked to sessions and users.
- Aggregate feedback into per-mentee progress snapshots (avg rating, monthly trend, recent public comments) for fast UI reads.
- Expose secure endpoints so mentees, mentors and admins see the correct snapshot data and recent comments (respecting visibility rules).

Minimal acceptance criteria

1. Mentor can submit rating + comment for a completed session via POST /api/sessions/:sessionId/mentor-feedback.
2. Only a session's mentor may submit/edit feedback and editing is allowed only within a configured window.
3. Mentees can retrieve their aggregated snapshot via GET /api/mentor-feedback/progress and see public comments on their profile when viewing self.
4. Admins and mentors with session relationships can fetch mentee snapshots via GET /api/mentor-feedback/mentees/:menteeId/progress.

---

## 2. Data model (schema & indexing)

Suggested Mongoose schema (example):

```js
const MentorFeedbackSchema = new Schema({
  sessionId: { type: ObjectId, ref: 'Session', required: true, index: true },
  mentorId: { type: ObjectId, ref: 'User', required: true, index: true },
  menteeId: { type: ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  sanitizedComment: { type: String },
  competencies: [{ skillKey: String, level: Number, notes: String }],
  visibility: { type: String, enum: ['public','private'], default: 'public' },
  editWindowClosesAt: { type: Date },
  lastNotifiedAt: { type: Date },
}, { timestamps: true });

MentorFeedbackSchema.index({ menteeId: 1, createdAt: -1 });
```

Progress snapshots (for fast UI ingestion) should be an aggregated collection with fields like:

- menteeId
- ratingAvg
- ratingCount
- monthlyTrend[]
- recentComments[]
- milestones
- lastUpdated

Notes: add indexes for frequent queries (menteeId, mentorId, sessionId). Consider capping recentComments or TTL strategies for very large histories.

---

## 3. Backend API contracts

All controllers should use existing response helpers (ok / fail) and validate input using Joi/Yup.

### POST /api/sessions/:sessionId/mentor-feedback

Role: mentor (authenticated)

Request body (JSON):

```json
{
  "rating": 4,
  "comment": "Good progress — keep working on communication",
  "competencies": [{ "skillKey": "communication", "level": 4 }],
  "visibility": "public"
}
```

Responses

- 200 OK — feedback created/updated; returns mentor view shape with editWindowClosesAt.

```json
{ "success": true, "feedback": { "id": "...", "rating": 4, "visibility": "public" } }
```

- 400 BAD REQUEST — validation errors
- 403 FORBIDDEN — not session mentor OR session not completed
- 409 CONFLICT — feedback already exists (optional behavior)

Server behaviour (summary)

- validate session existence and completion
- ensure user is session mentor
- sanitize comment (strip HTML/newlines), set editWindowClosesAt
- create/update MentorFeedback and call mentorFeedbackAggregation.queueProgressSnapshotBuild
- emit notification to mentee + record audit log entry

### GET /api/mentor-feedback/progress

Role: mentee (authenticated)

Response: { snapshot: { menteeId, ratingAvg, ratingCount, monthlyTrend, recentComments, milestones } }

### GET /api/mentor-feedback/mentees/:menteeId/progress

Role: admin | mentor with session relationship | mentee themself

Server must check authorization and may rebuild snapshot on demand.

---

## 4. Frontend integration (components & UX)

Primary UI pieces

- FeedbackForm — shown on session detail / post-session where session is completed and requester is mentor.
- ProgressDashboard — shows ratingAvg, monthlyTrend chart, recentComments list.
- MenteeProfileDrawer — includes snapshot when viewing own profile; shows public comments.

UX considerations

- FeedbackForm: star selector (1–5), textarea, optional competencies, submit button, validation.
- Privacy: private comments are not shown in mentee views; mentors/admins see appropriate detail.

---

## 5. Dashboards & analytics

Mentor dashboard features

- per-mentee snapshot card with avg rating and sparkline
- mentee detail: trend chart, session counts, common competency gaps

Use lazy-loading for charts (Recharts / Chart.js) and paginated lists for large data sets.

---

## 6. Security, privacy & audit

- Enforce server-side role checks for create/update/read operations.
- Ensure row-level filters so mentees see only their data and mentors see only their mentees (unless admin).
- Record `FeedbackAuditLog` entries on create/update/view for non-repudiation.

---

## 7. Testing & rollout

Tests to add

- Backend unit tests (node --test / Jest) for create/update/fetch and permission checks.
- Integration tests using `mongodb-memory-server` to validate aggregation and rebuild flows.
- Frontend Jest + RTL tests for form visibility, submit flow and snapshot display.
- Playwright E2E scenario: mentor submits feedback and mentee sees snapshot on profile.

Rollout notes

- Add feature flag `VITE_FEATURE_SESSION_FEEDBACK` for controlled rollout.
- Add metric for `mentorFeedbackAggregation` runs and monitor snapshot coverage/backfill needs.

---

## 8. Implementation checklist (priority)

Backend (priority)

1. Add `backend/src/models/MentorFeedback.js` and tests.
2. Implement controller methods in `mentorFeedbackController` and update `mentorFeedbackRoutes.js`.
3. Ensure `mentorFeedbackAggregationWorker` supports rebuilds and that `ProgressSnapshot` is index-optimized.
4. Add `FeedbackAuditLog` model and emit audit events.

Frontend (priority)

1. Add `FeedbackForm` component and service methods in `frontend/src/shared/services/mentorFeedbackService.ts`.
2. Render snapshots in `ProgressDashboard` and `MenteeProfileDrawer`, respecting privacy.
3. Add unit tests and a Playwright smoke test for end-to-end feedback → snapshot visibility.

CI / Monitoring

1. Add backend tests to CI and ensure `mongodb-memory-server` is available.
2. Add Playwright job if desired (nightly or matrix-based).

---

If you want, I can now scaffold the MentorFeedback model and controller (backend) with tests, or build the FeedbackForm UI and tests (frontend). Tell me which to start and I'll implement it next.
# Implementation Plan — Mentor Feedback & Progress Tracking

**Last updated:** 2025-11-22

This implementation-level plan adds structured mentor feedback and progress-tracking features. It targets engineers, QA, and product teams and covers data model changes, API contracts, frontend integration points, acceptance criteria and a developer checklist.
---

## 1 — Goals & acceptance criteria

- Allow mentors to submit structured feedback (rating + optional comment and competencies) for completed sessions.
- Persist feedback in a dedicated collection linked to sessions, mentors and mentees.
- Aggregate feedback into per-mentee progress snapshots (averages, trend points, recent public comments).
- Let mentees view their aggregated snapshot and recent public comments; allow mentors/admins authorized views in mentor workflows.

Minimal acceptance criteria

1. Mentor can submit rating + comment for a completed session via POST `/sessions/:sessionId/mentor-feedback`.
2. System enforces that only the session's mentor can submit (or edit within allowed window) and that feedback is only available after completion.
3. Mentees can retrieve their aggregated snapshot via GET `/mentor-feedback/progress` and see recent public comments on their profile when viewing self.
4. Admins and authorized mentors (who have had sessions) can retrieve mentee snapshots via GET `/mentor-feedback/mentees/:menteeId/progress`.

---

## 2 — Data model (schema samples & indexing)

Suggested Mongoose schema for `MentorFeedback`:

```js
const MentorFeedbackSchema = new Schema({
  sessionId: { type: ObjectId, ref: 'Session', required: true, index: true },
  mentorId: { type: ObjectId, ref: 'User', required: true, index: true },
  menteeId: { type: ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  sanitizedComment: { type: String },
  competencies: [{ skillKey: String, level: Number, notes: String }],
  visibility: { type: String, enum: ['public','private'], default: 'public' },
  editWindowClosesAt: { type: Date },
  lastNotifiedAt: { type: Date },
}, { timestamps: true });

MentorFeedbackSchema.index({ menteeId: 1, createdAt: -1 });
```

Progress snapshots (for quick UI reads) should be an aggregated collection (e.g. `ProgressSnapshot`) with fields such as:

- menteeId
- ratingAvg
- ratingCount
- monthlyTrend[]
- recentComments[]
- milestones
- lastUpdated

Add database indexes to support frequent queries (e.g., menteeId, mentorId, sessionId). Consider TTL or capping recentComments array if very large.

---

## 3 — Backend API contracts (requests & responses)

Note: controllers should use existing `ok(res, ...)` / `fail(res, ..)` response helpers and validate input with Joi/Yup.

### POST /api/sessions/:sessionId/mentor-feedback

Role: mentor (authenticated)

Request (JSON)

```json
{
  "rating": 4,
  "comment": "Solid progress — strong communication",
  "competencies": [{ "skillKey": "communication", "level": 4 }],
  "visibility": "public"
}
```

Responses

- 200 OK — feedback created or updated (return `feedback` object in mentor view shape)

```json
{ "success": true, "feedback": { "id": "...", "rating": 4, "visibility": "public" } }
```

- 400 BAD REQUEST — invalid payload (rating out of range, too-long comment)
- 403 FORBIDDEN — user is not session mentor or session not completed
- 409 CONFLICT — feedback already exists and cannot be re-created (if controlled elsewhere)

Server behavior

- Ensure session exists, has a mentee, and is in a completed/attended state
- Ensure requester is the session's mentor
- Validate payload: rating between 1–5; sanitize comment (remove HTML and newlines) -> sanitizedComment
- Create or update the MentorFeedback doc and set editWindowClosesAt using config value (e.g., MENTOR_FEEDBACK_EDIT_WINDOW_DAYS).
- Queue aggregation: call mentorFeedbackAggregation.queueProgressSnapshotBuild(menteeId)
- Notify the mentee (push/email) and record an audit log entry.

### GET /api/mentor-feedback/progress

Role: mentee (authenticated)

Response (JSON)

```json
{ "snapshot": { "menteeId":"...","ratingAvg":4.2,"ratingCount":5,"monthlyTrend":[...],"recentComments":[...] } }
```

### GET /api/mentor-feedback/mentees/:menteeId/progress

Role: admin | mentor (with session relationship) | mentee themself

Behavior: enforce authorization server-side. Optionally rebuild snapshot if missing.

---

## 4 — Frontend integration (components & UX)

Where to add UI pieces

- Session detail / post-session page: `FeedbackForm` (mentor-only), connected to `mentorFeedbackService.createMentorFeedback` and shows status/confirmation on success.
- Mentee progress pages/components: `ProgressDashboard` should render ratingAvg, monthlyTrend (chart), recentComments list.
- Mentee profile drawer: embed snapshot when the viewer is self; show recent public comments.

UX details

- Feedback form: star selector (1–5), optional comment, optional competencies field, submit button. Show validation messages and disallow submission unless session is completed.
- Comments respect visibility; private comments hidden from mentee views but available to mentors/admins where applicable.

---

## 5 — Dashboards & analytics

Mentor dashboard features

- Mentee list with small snapshot card: currentAvg, trend sparkline, recentComment preview
- Mentee detail: full trend chart, session counts, top competencies (aggregate), and per-session feedback list (mentor-only)

Tech: use Recharts / Chart.js for trends; lazy-load heavy charts.

---

## 6 — Security, privacy & audit

- Only mentors for a session may submit/edit feedback (server checks required).
- Mentees only see their own snapshots; mentors only see their mentees; admins can view wider data.
- Record `FeedbackAuditLog` entries on create/update/view as needed for traceability.

---

## 7 — Testing & rollout

Tests to add

- Backend unit tests (node --test / Jest): create, update, fetch feedback; permission checks; aggregation queueing; rebuild snapshot flow.
- Integration tests using `mongodb-memory-server` for snapshot rebuild flow.
- Frontend Jest + RTL tests: feedback form appears under correct conditions, submit flow, snapshot display, privacy rules for comments.
- Playwright E2E sample: mentor submits feedback and mentee sees aggregated snapshot on their profile.

Rollout notes

- Add environment toggle `VITE_FEATURE_SESSION_FEEDBACK` to gate UI while rolling out.
- Add log/metric for `mentorFeedbackAggregation` runs to monitor backfill needs.

---

## 8 — Implementation checklist (priority first)

Backend (priority)

1. Add `MentorFeedback` model and unit tests — `backend/src/models/MentorFeedback.js` + `src/__tests__/mentorFeedback.*.test.js`.
2. Implement `mentorFeedbackController.createMentorFeedback`, `updateMentorFeedback`, `getMentorFeedbackForSession`, `getOwnProgressSnapshot`, `getProgressSnapshotForMentee` — tests to cover auth rules and happy/failure paths.
3. Ensure `mentorFeedbackAggregationWorker` supports rebuilds and `ProgressSnapshot` model is designed for read efficiency.
4. Add `FeedbackAuditLog` model and create audit events for create/update/view.

Frontend (priority)

1. Add `FeedbackForm` component and service methods in `frontend/src/shared/services/mentorFeedbackService.ts`.
2. Add snapshot display to `ProgressDashboard`, `MenteeProfileDrawer` and ensure privacy logic (viewerIsSelf, viewerIsMentor, viewerIsAdmin).
3. Add Jest tests and a Playwright smoke test for feedback flow.

CI / Monitoring

1. Add backend tests to CI (node --test) and ensure `mongodb-memory-server` runs correctly in CI.
2. Add Playwright e2e job optionally gated behind a matrix job or nightly run.

---

If you'd like, I can now scaffold the `MentorFeedback` model + controller (backend) and include tests, or implement the `FeedbackForm` component and tests in the frontend branch — tell me which to start and I will proceed.
# Implementation Plan: Mentor Feedback and Progress Tracking

## Overview

This document is an implementation-level plan for adding structured mentor feedback and progress-tracking to the platform. It targets engineers, QA, and product owners and assumes the system already has sessions, users, and a basic profile flow. It contains schema samples, API contracts, acceptance criteria, tests and an implementation checklist mapped to code locations in this repository.

---

## 1. Data model — schema & indexing

Provide the canonical growth-safe model additions and indexes to support queries and aggregation.

### MentorFeedback (Mongo / Mongoose schema example)

```js
const MentorFeedbackSchema = new Schema({
  sessionId: { type: ObjectId, index: true, required: true, ref: 'Session' },
  mentorId: { type: ObjectId, index: true, required: true, ref: 'User' },
  menteeId: { type: ObjectId, index: true, required: true, ref: 'User' },
  rating: { type: Number, required: true, min:1, max:5 },
  comment: { type: String },
  sanitizedComment: { type: String }, // stored safe for display to mentees
  visibility: { type: String, enum: ['public','private'], default: 'public' },
  editWindowClosesAt: { type: Date },
  const MentorFeedbackSchema = new Schema({
    sessionId: { type: ObjectId, index: true, required: true, ref: 'Session' },
    mentorId: { type: ObjectId, index: true, required: true, ref: 'User' },
    menteeId: { type: ObjectId, index: true, required: true, ref: 'User' },
    rating: { type: Number, required: true, min:1, max:5 },
    comment: { type: String },
    sanitizedComment: { type: String }, // stored safe for display to mentees
    visibility: { type: String, enum: ['public','private'], default: 'public' },
    editWindowClosesAt: { type: Date },
    lastNotifiedAt: { type: Date },
  }, { timestamps: true });

  MentorFeedbackSchema.index({ menteeId: 1, createdAt: -1 });
  lastNotifiedAt: { type: Date },

MentorFeedbackSchema.index({ menteeId: 1, createdAt: -1 });
```
  - New `Feedback` (or `MentorFeedback`) entity linked to sessions and users.
  - Fields: `feedback_id`, `session_id`, `mentor_id`, `mentee_id`, `rating` (1–5), `comments` (text), `timestamp`.
- **Session Updates:**
  - Ensure `Session` entity has a `status` flag (e.g., `Completed`).
- **User Roles:**
  - `User` table manages roles (mentor/mentee).
  - Feedback references correct mentor as author and mentee as recipient.
  - Indexes on `session_id`, `mentor_id`, `mentee_id` for fast lookups.
  - Aggregate queries for average rating, trends, and progress snapshots.

---

## 2. Backend services & API contracts

Below are concrete endpoint contracts to implement and tests that should accompany each.
### POST /api/sessions/:sessionId/mentor-feedback

Role: mentor (authenticated)

Request body

```json
{ "rating": 4, "comment": "Made good progress", "competencies": [{"skillKey":"communication","level":4}], "visibility": "public" }

Responses

  ```
- 400 BAD REQUEST — validation error (rating out of range, session missing)
- 403 FORBIDDEN — user not the session mentor or session not completed
- validate session id, ensure session.status === 'completed' || attended
- ensure requester is session.mentor
- create MentorFeedback with sanitizedComment and set editWindowClosesAt
- queue snapshot aggregation (background worker) and notify mentee via notifications service

### GET /api/mentor-feedback/mentees/:menteeId/progress

Role: admin | mentor (with session relationship) | mentee themself

Returns a progress snapshot for the mentee (aggregated averages, trends, recentComments):

```json
```

- **Mentor Dashboard Data:**
  - `GET /api/mentors/{id}/mentees/{mid}/progress`: Aggregated stats (avg rating, session count, improvement metrics).
- **Business Logic:**
  - One feedback per session; feedback only after completion.
  - Optionally trigger notifications to mentee after feedback submission.
  - Enforce rating range, comment length, and role checks.
  - Clear error messages for unauthorized or invalid actions.
---

- **Feedback Submission Form:**
  - Appears on session detail/post-session page for mentors when session is completed and feedback not yet submitted.
- **Mentee Progress View:**
  - On mentee profile/progress page, list all received feedback (mentor name, date, rating, comment).
- **UI Components:**
  - Standard elements: star icons, comment text, timestamps.
- **Notifications:**
  - Badge/alert on mentee dashboard for new feedback (e.g., "You have 2 new session evaluations").
---

- **Progress Dashboard:**
  - Mentor dashboard summarizes mentee growth: avg rating trend, session count, improvement areas.
- **Key Metrics:**
  - "Average Session Score", "Total Feedback Entries", goal completion status.
- **Responsive Design:**
  - Mobile-friendly, performant, paginated/lazy-loaded for large datasets.
---

- **Role Checks:**
  - JWT/session verified against mentor/session before allowing submission.
- **Data Privacy:**
- **Audit Trail:**
  - Log who submitted feedback and when for dispute resolution.
---

- **Unit & Integration Tests:**
  - Test endpoints (submit/fetch feedback), DB layer, edge cases (no feedback, invalid ID, duplicates).
- **User Feedback Loop:**
  - Solicit user feedback post-launch; iterate on rubric, anonymization, or new metrics as needed.

---

- Mentors can submit a rating and optional text comment for a completed session using POST `/sessions/:sessionId/mentor-feedback`.
- Only the session mentor can submit and edit during an allowed window (configurable days).
- Mentees can view aggregated snapshot and recent public comments in `/mentor-feedback/progress` and on their profile when viewing self.
- Mentors and admins can fetch mentee snapshots when authorized.

- [ ] Implement endpoints in `mentorFeedbackController` using existing patterns (`ok/fail` responses) and unit tests in `src/__tests__`.
- [ ] Update `mentorFeedbackRoutes.js` with rate limiter and add route-level tests.
- [ ] Ensure `mentorFeedbackAggregationWorker` supports rebuilds on demand and re-index the `ProgressSnapshot` model.

- [ ] Add `FeedbackForm` in `components/session/*` and use `mentorFeedbackService.createMentorFeedback`
- [ ] Add `ProgressSnapshot` display to `ProgressDashboard` and `MenteeProfileDrawer` (respect visibility and viewer scope).
Testing & CI

- [ ] Add backend Node tests (mongodb-memory-server) covering create/update/fetch snapshot behavior.
Deployment & rollout
- [ ] Add necessary env flags and monitoring (traces, metric for aggregation worker runs).
- [ ] Run backfill (if older sessions already exist) with `scripts/backfillFeedbackStats.js`.

---

If you'd like, I can now:

1. Add request/response JSON schemas into `backend/docs` and create tests.
2. Scaffold the `MentorFeedback` Mongoose model and unit tests (backend).
3. Add the `FeedbackForm` component and related frontend tests.

Pick one of the actions above and I'll proceed.
By adding a normalized Feedback entity, APIs, and UI components, mentors can submit ratings/comments and mentees can track progress. Dashboards and reports (avg rating over time, goal completion) help mentors guide mentees. This closes the feedback loop and aligns with industry best practices for mentoring platforms.

**Sources:** omr.com, ideausher.com, qooper.io, geeksforgeeks.org (review system design), industry write-ups on mentorship software.
