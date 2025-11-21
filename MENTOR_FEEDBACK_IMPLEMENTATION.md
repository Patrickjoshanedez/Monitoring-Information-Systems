# Mentor Feedback — Implementation Plan (clean reference)

Last updated: 2025-11-22

This is a concise, engineer-focused implementation reference for the Mentor Feedback / Progress Tracking feature. Use this for development, testing and PR checklists.

---

## Overview

Add structured mentor feedback (ratings + comments + competency levels) per session and aggregate these into per-mentee progress snapshots for dashboards and profile views.

### Non-goals

- This plan is not a full UI design document; it contains the necessary developer-level details and acceptance criteria.

---

## Data model (final)

Mongoose model: `backend/src/models/MentorFeedback.js` (example fields)

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
  lastNotifiedAt: { type: Date }
}, { timestamps: true });
```

Add indexes: `{ menteeId: 1, createdAt: -1 }` and others as needed.

---

## API contracts (recommended surface)

1) POST /api/sessions/:sessionId/mentor-feedback

- Role: mentor (must be session mentor)
- Create or update feedback for a completed session.

Request sample

```json
{
  "rating": 5,
  "comment": "Great progress — continue the same approach",
  "competencies": [{ "skillKey": "planning", "level": 4 }],
  "visibility": "public"
}
```

Success response (200)

```json
{ "success": true, "feedback": { "id": "..." } }
```

Errors

- 400 validation error
- 403 if user not mentor or session not completed
- 409 conflict (if duplicate semantics chosen)

### GET /api/mentor-feedback/progress

- Role: mentee (auth)

- Returns current progress snapshot for the authenticated mentee.

### GET /api/mentor-feedback/mentees/:menteeId/progress

- Role: admin | mentor with at least one related session | the mentee themself

- Returns snapshot for a specific mentee; server may rebuild snapshot if missing.

---

## Frontend components (map)

- `FeedbackForm` — attach to session detail / post-session view; calls `mentorFeedbackService.createMentorFeedback`.
- `ProgressDashboard` — renders snapshot charts (ratingAvg, monthly trend) and recent public comments.
- `MenteeProfileDrawer` — include snapshot when viewer is self.

---

## Acceptance checks / tests

- Backend unit tests:
  - create feedback as mentor for completed session
  - reject as non-mentor or incomplete session
  - update feedback within edit window; dispatch queue to aggregation
- Integration tests: snapshot rebuild workflows (using mongodb-memory-server)
- Frontend tests: Feedback form visibility; submit -> success; snapshot appears in dashboard/profile
- Playwright E2E: mentor submits feedback -> mentee sees changes in profile/dash

---

## Implementation checklist (minimal)

- [ ] Add `MentorFeedback` model & indexes (backend)
- [ ] Controller methods + routes + tests (create/update/get) (backend)
- [ ] Aggregation worker adopt/rebuild snapshot path + tests (backend)
- [ ] Add `FeedbackForm` + service + tests (frontend)
- [ ] Add snapshot rendering + tests (frontend)
- [ ] Add E2E test (Playwright) and CI job (optional)

---

If you'd like I can scaffold the backend model/controller/tests now, or implement the frontend `FeedbackForm` with tests — which one should I start?
