# MUS007 — Mentor feedback, session evaluations & progress tracking

Labels: enhancement, feature, MUS007, priority:high
Assignees: @product, @backend, @frontend

## Summary

As a mentor, I want to provide feedback, evaluate sessions, and track mentee progress so that I can monitor development and adjust my guidance accordingly.

## Acceptance Criteria (Given / When / Then)

1. Given a session is completed, when I submit feedback and ratings, then mentees can view them in their progress tracker.

2. Given multiple sessions are completed, when I view the progress dashboard, then I can track mentee growth and identify improvement areas.

3. Given feedback is saved, when mentees access their profiles, then they can view evaluations and comments from mentors.
.
## Items

- Add feedback form for mentors (structured rating + comments + optional checklist/labels + visibility setting)
- Persist mentor feedback (`MentorFeedback`) and link to session/mentee
- Create/Update ProgressSnapshot per mentee on feedback acceptance via `mentorFeedbackAggregationWorker`
- Ensure mentee-facing endpoints return sanitized feedback (e.g., hide sensitive mentor notes if set to private)
- Render progress dashboard and profile UI components for mentees to view snapshots and recent feedback snippets
- Add notifications and audit logs (FeedbackAuditLog) for feedback actions

## Checklist

- [ ] Backend: POST /sessions/:sessionId/mentor-feedback (create) + PUT /sessions/:sessionId/mentor-feedback (update)
- [ ] Backend: Aggregation worker generates ProgressSnapshot for mentees
- [ ] Backend tests: controller + aggregation worker + visibility tests
- [ ] Frontend: Mentor feedback UI + hooks + validation
- [ ] Frontend: Mentee ProgressDashboard + profile view + tests
- [ ] E2E: Feedback submission → snapshot → mentee view flow

## Proposed schedule

- Plan & design: 1 day
- Backend implementation & tests: 2-3 days
- Frontend UI & tests: 3 days
- E2E & polish: 1 day

## Notes

- Feedback retention and visibility governed by config: `backend/src/config/feedback.js`
- Use existing controllers & routes (`mentorFeedbackController`, `feedbackRoutes`) and extend tests in `backend/src/__tests__`

---
Created by automation via Copilot session on {date}
