# MUS006 — Session management: availability, scheduling & attendance

Labels: enhancement, feature, MUS006, priority:high
Assignees: @product, @backend, @frontend
Milestone: Iteration
Dates: target start: TBD, review: TBD

## Summary

As a mentor, I want to set my availability, schedule sessions, and manage session details (confirm, reschedule, cancel, and record attendance) so that meetings happen at mutually convenient times and are tracked.

## Acceptance Criteria (Given / When / Then)

1. Given I am logged in as a mentor, when I open the Schedule tab, then I can create and edit available time slots.

2. Given a mentee books a session, when I confirm or reschedule, then the updated session details are saved and notifications are sent to attendees.

3. Given a session concludes, when I mark attendance, then the attendance record is stored and available for reporting and progress snapshots.

4. Given scheduled sessions exist, when I view the mentor sessions page, then I can search, filter, and perform common actions (confirm, reschedule, cancel, open chat, and open feedback/ui hooks).

## Items

- Backend: availability model + endpoints to create/list/remove slots
- Backend: endpoints for creating and modifying mentor sessions (create, confirm, reschedule, cancel, mark complete/attended)
- Backend: notifications (email/push) on booking, confirmation, reschedule, cancellation
- Backend: audit logs for session changes and attendance recording
- Frontend: Schedule tab & Sessions manager for mentors (create availability UI, session list, confirm/reschedule/cancel, record attendance)
- Frontend: Mentee booking flow integration + client-side validations
- Tests: unit + integration tests for session lifecycle and attendance storage

## Checklist

- [ ] Backend: availability model + CRUD endpoints
- [ ] Backend: session lifecycle endpoints (confirm/reschedule/cancel/complete)
- [ ] Backend tests: controllers + worker tests + notifications
- [ ] Frontend: Schedule UI + Sessions manager edits + validation
- [ ] Frontend tests: RTL for mentor schedule + session actions
- [ ] E2E: Full booking -> confirm/reschedule -> attendance -> reporting flow

## Members

- Product: @product
- Backend: @backend
- Frontend: @frontend
- QA: @qa

## Notes

- Use the existing sessions domain/services as a starting point: `backend/src/controllers/sessionController.js`, `frontend/src/shared/services/sessionsService.ts`.
- Consider re-using booking lock / availability patterns used elsewhere (booking lock model, availability CRUD) and keep validations consistent.
- Ensure notification and audit logging is consistent with platform patterns.

---
Created by request from the team on {date}
