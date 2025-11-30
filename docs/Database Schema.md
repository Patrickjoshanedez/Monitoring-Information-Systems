## Database Schema

This system uses MongoDB with Mongoose models to represent the core entities involved in the mentoring workflow. Below is a concise schema overview of the main collections, focusing on field names, types, and roles in the system.

> Note: All collections include Mongoose's automatic `createdAt` and `updatedAt` timestamp fields unless otherwise noted.

---

### 1. `users` Collection (`User` model)

Stores all system accounts (admins, mentors, mentees), their application data, profiles, settings, and aggregated ratings.

**Key Fields**

- `_id` (ObjectId) – Primary key.
- `firstname` (String, required* if no `googleId`) – User's first name.
- `lastname` (String, required* if no `googleId`) – User's last name.
- `email` (String, unique, required) – Login identifier; stored lowercase.
- `password` (String, hashed) – Bcrypt-hashed password (may be null for OAuth users).
- `role` (String, enum: `mentee`, `mentor`, `admin`, default: `null`) – Effective role in the system.
- `accountStatus` (String, enum: `active`, `deactivated`, `suspended`, default: `active`) – Current account state; indexed.
- `deletedAt` (Date) – Soft-delete timestamp.
- `googleId` (String) – OAuth provider identifier when using Google login.
- `resetPasswordToken` (String), `resetPasswordExpires` (Date) – Password reset flow.
- `loginAttempts` (Number, default: 0), `lockUntil` (Date) – Brute-force protection.

**Application Flow Fields**

- `applicationStatus` (String, enum: `not_submitted`, `pending`, `approved`, `rejected`, default: `not_submitted`) – Onboarding state.
- `applicationRole` (String, enum: `mentee`, `mentor`, `admin`, default: `null`) – Role being applied for.
- `applicationData` (Embedded Object) – Detailed application form data, including:
	- `yearLevel`, `program`, `major` (String) – Academic details.
	- `specificSkills`, `programmingLanguage`, `motivation`, `currentRole`, `organization` (String) – Skills and context.
	- `yearsOfExperience` (Number) – For mentors.
	- `expertiseAreas`, `mentoringTopics`, `interests` (String[]) – Areas of focus.
	- `mentoringGoals`, `professionalSummary`, `achievements` (String) – Narrative fields.
	- `corUrl`, `supportingDocumentUrl`, `linkedinUrl`, `portfolioUrl` (String) – Document and link fields.
	- `availabilityDays` (String[]), `availabilityHoursPerWeek` (Number), `meetingFormats` (String[]) – Scheduling preferences.
- `applicationSubmittedAt`, `applicationReviewedAt` (Date) – Audit timestamps.
- `applicationReviewedBy` (ObjectId → `User`) – Admin reviewer.

**Profile Subdocument**

- `profile.displayName` (String) – Name shown in UI.
- `profile.photoUrl` (String), `photoPublicId` (String) – Avatar references.
- `profile.bio` (String) – Short biography.
- `profile.expertiseAreas`, `profile.skills` (String[]) – Mentor-facing strengths.
- `profile.availabilitySlots[]` – Simple availability snapshot:
	- `day` (String, enum: `mon`–`sun`)
	- `start`, `end` (String, `HH:mm` 24h format)
- `profile.education` – For mentees:
	- `program`, `yearLevel`, `major` (String)
- `profile.coursesNeeded` (String[]), `interests` (String[]), `learningGoals` (String), `timezone` (String).
- `profile.contactPreferences` (String[], enum: `email`, `in_app`, `sms`).
- `profile.privacy` – Per-field privacy settings (String enums: `public`, `mentors`, `private`) for `bio`, `education`, `expertiseAreas`, `skills`, `availabilitySlots`, `interests`, `learningGoals`, `coursesNeeded`, `contact`, `photo`, `displayName`.

**Settings and Metrics**

- `notificationSettings.channels` – Per-event channel toggles for in‑app/email:
	- `sessionReminders`, `matches`, `announcements`, `messages` (each with `inApp`/`email` Booleans).
- `notificationSettings.sessionReminders` – Reminder behavior:
	- `enabled` (Boolean, default: `true`).
	- `offsets` (Number[], default: `[2880, 1440, 60]`) – Minutes before session; validated 1–10080.
- `mentorSettings.capacity` (Number, default: 3, min: 1) – Max concurrent mentees.
- `mentorSettings.activeMenteesCount` (Number, default: 0).
- `mentorSettings.capacityUpdatedAt` (Date).
- `calendarIntegrations.google` – Google Calendar integration settings (refresh token, calendarId, accountEmail, grantedScopes, syncEnabled, timestamps, lastError).
- `feedbackStats` – Aggregated review data:
	- `totalReviews`, `totalScore`, `averageRating` (Number), `lastReviewAt` (Date).
- `ratingAvg` (Number, default: 0), `ratingCount` (Number, default: 0) – Simplified rating metrics.

**Important Indexes**

- `{ role: 1, applicationStatus: 1 }` – For admin filters and matching queries.
- `{ accountStatus: 1, deletedAt: 1 }` – Active/soft-deleted lookups.
- `{ role: 1, 'feedbackStats.averageRating': -1 }`, `{ ratingAvg: -1 }` – Mentor ranking.

---

### 2. `sessions` Collection (`Session` model)

Represents mentoring sessions between mentors and mentees, including scheduling, status, attendance, and calendar sync.

**Key Fields**

- `_id` (ObjectId) – Primary key.
- `mentee` (ObjectId → `User`, optional) – Mentee for the session.
- `mentor` (ObjectId → `User`, required) – Mentor leading the session.
- `subject` (String, required) – Topic or title of the session.
- `date` (Date, required, alias: `scheduledAt`) – Start time of the session.
- `endDate` (Date) – End time; auto-derived from `date` + `durationMinutes`.
- `durationMinutes` (Number, default: 60, min: 0) – Duration in minutes.
- `status` (String, enum: `pending`, `confirmed`, `rescheduled`, `cancelled`, `completed`, default: `pending`, indexed).
- `statusMeta` – Lifecycle metadata:
	- `confirmedAt`, `rescheduledAt`, `cancelledAt` (Date).
	- `cancellationReason` (String, max: 500).
	- `cancellationBy` (ObjectId → `User`).
- `room` (String) – Physical/virtual room identifier.
- `capacity` (Number, default: 1, min: 1, max: 500) – Max participants allowed.
- `isGroup` (Boolean, default: false) – Marks group sessions.
- `availabilityRef` (ObjectId → `Availability`) – Availability slot used to create this session.
- `lockId` (String) – Booking lock reference for conflict prevention.

**Participants & Attendance**

- `participants[]` – Invitees beyond the main mentee:
	- `user` (ObjectId → `User`, required).
	- `status` (String, enum: `invited`, `confirmed`, `declined`, `removed`, `pending`, default: `invited`).
	- `invitedAt` (Date, default: now), `respondedAt` (Date).
- `attendance[]` – Recorded attendance:
	- `user` (ObjectId → `User`, required).
	- `status` (String, enum: `present`, `absent`, `late`, required).
	- `recordedBy` (ObjectId → `User`, required), `recordedAt` (Date, default: now).
	- `note` (String, max: 280).

**Review & Chat & Calendar**

- `adminReview` – Flags for admin scrutiny:
	- `flagged` (Boolean, default: false), `reason` (String, max: 500), `notes` (String, max: 2000).
	- `flaggedAt`, `flaggedBy`, `updatedAt`, `updatedBy` (ObjectId → `User`, Dates).
- `chatThread` (ObjectId → `ChatThread`) – Linked discussion thread.
- `googleEvents[]` – Per-user Google event references:
	- `user` (ObjectId → `User`), `eventId`, `calendarId`, `status` (Strings), `syncedAt` (Date).
- `calendarEvent` – Aggregated calendar provider info:
	- `provider` (String, enum: `google`, default: `null`).
	- `externalId`, `calendarId`, `htmlLink`, `hangoutLink`, `status` (Strings).
	- `updatedAt`, `lastSyncedAt` (Date).
	- `lastSyncError` (code, message, occurredAt).

**Outcome & Reminders**

- `attended` (Boolean, default: false) – Quick indicator for main attendance.
- `completedAt` (Date) – When the session was completed.
- `tasksCompleted` (Number, default: 0, min: 0) – Number of tasks accomplished.
- `notes` (String) – Mentor/mentee notes.
- `remindersSent[]` – History of reminders:
	- `offsetMinutes` (Number, min: 1, required) – Minutes before scheduled time.
	- `sentAt` (Date, default: now).
	- `recipient` (ObjectId → `User`).
	- `channels.inApp`, `channels.email` (Boolean).

**Important Indexes**

- `{ mentee: 1, date: -1 }`, `{ mentor: 1, date: -1 }` – Timeline queries.
- `{ mentor: 1, status: 1, date: -1 }` – Mentor dashboards.
- `{ availabilityRef: 1, date: 1 }` – Availability-based lookups.
- `{ 'participants.user': 1, date: -1 }` – Group participant feeds.
- `{ lockId: 1 }` – Booking lock resolution.
- `{ mentee: 1, createdAt: -1 }`, `{ mentor: 1, createdAt: -1 }` – Feeds/exports.

---

### 3. `feedback` Collection (`Feedback` model)

Stores mentee feedback for completed mentoring sessions.

**Key Fields**

- `_id` (ObjectId) – Primary key.
- `sessionId` (ObjectId → `Session`, required, indexed) – Target session.
- `mentorId` (ObjectId → `User`, required, indexed) – Mentor being evaluated.
- `menteeId` (ObjectId → `User`, required) – Mentee giving feedback.
- `rating` (Number, min: 1, max: 5, required) – Overall rating.
- `text` (String, max: 2000) – Raw free-text feedback.
- `sanitizedText` (String, max: 2000) – Cleaned/HTML-safe version.
- `flagged` (Boolean, default: false) – Marked for review.
- `flagReason` (String, max: 1000) – Why it was flagged.
- `anonymizedCode` (String, max: 16) – Optional anonymous identifier.
- `windowClosesAt` (Date) – Deadline for providing/updating feedback.
- `submittedAt` (Date, default: now) – When first submitted.
- `updatedBy` (ObjectId → `User`) – Last editor.

**Important Indexes**

- `{ sessionId: 1, menteeId: 1 }` (unique) – One feedback per mentee per session.
- `{ mentorId: 1, submittedAt: -1 }` – Mentor-centric feedback history.

---

### 4. `mentorfeedbacks` Collection (`MentorFeedback` model)

Contains mentor-provided evaluations of mentees, focused on competencies and long-term progress.

**Key Fields**

- `_id` (ObjectId) – Primary key.
- `sessionId` (ObjectId → `Session`, required, indexed) – Related session.
- `mentorId` (ObjectId → `User`, required, indexed) – Mentor author.
- `menteeId` (ObjectId → `User`, required, indexed) – Mentee being evaluated.
- `rating` (Number, min: 1, max: 5, required) – Overall mentor rating.
- `competencies[]` – Per-skill evaluations:
	- `skillKey` (String, max: 64, required).
	- `level` (Number, min: 1, max: 5, required).
	- `notes` (String, max: 500).
- `comment` (String, max: 2000) – Raw mentor comments.
- `sanitizedComment` (String, max: 2000) – Cleaned version.
- `visibility` (String, enum: `public`, `private`, default: `public`, indexed) – Whether mentees/admins see it.

**Moderation & Notifications**

- `moderation` – Embedded moderation block:
	- `flagged` (Boolean, default: false).
	- `reason` (String, max: 500).
	- `flaggedBy` (ObjectId → `User`), `flaggedAt` (Date).
- `editWindowClosesAt` (Date, required) – Until when mentor may edit.
- `lastNotifiedAt` (Date) – Last time mentee/admins were notified.

**Important Indexes**

- `{ sessionId: 1, mentorId: 1 }` (unique) – One mentor feedback per mentor per session.
- `{ menteeId: 1, createdAt: -1 }`, `{ mentorId: 1, createdAt: -1 }` – Analytics & history.

---

### 5. `availabilities` Collection (`Availability` model)

Defines mentors' recurring or one-off availability windows used for generating match suggestions and booking sessions.

**Key Fields**

- `_id` (ObjectId) – Primary key.
- `mentor` (ObjectId → `User`, required, indexed) – Mentor owning this schedule.
- `type` (String, enum: `recurring`, `oneoff`, required) – Availability mode.
- `timezone` (String, default: `UTC`) – Default timezone.
- `recurring[]` – For `recurring` entries:
	- `dayOfWeek` (Number, 0–6) – Sunday–Saturday.
	- `startTime`, `endTime` (String, `HH:mm` 24h, required) – Time window.
	- `timezone` (String, default: `UTC`).
- `oneOff[]` – For `oneoff` entries:
	- `start`, `end` (Date, required) – Absolute time window.
	- `timezone` (String, default: `UTC`).
- `capacity` (Number, min: 1, max: 50, default: 1) – Max simultaneous mentees per slot.
- `note` (String, max: 500) – Internal/admin note.
- `active` (Boolean, default: true) – Toggle for use in matching.
- `metadata` (Object) – Free-form details.

**Important Indexes & Validation**

- `{ mentor: 1, active: 1 }`, `{ mentor: 1, updatedAt: -1 }` – Active availability lookups.
- Custom validation ensures:
	- `recurring` contains valid HH:mm times and non-zero duration.
	- `oneOff` slots have `end > start`.

---

### 6. `matchrequests` Collection (`MatchRequest` model)

Represents system-generated or curated mentor–mentee match suggestions.

**Key Fields**

- `_id` (ObjectId) – Primary key.
- `applicantId` (ObjectId → `User`, required) – Mentee candidate.
- `mentorId` (ObjectId → `User`, required) – Proposed mentor.
- `score` (Number, 0–100, default: 0) – Overall match score.
- `status` (String, enum:
	- `suggested`, `mentor_accepted`, `mentor_declined`,
	- `mentee_accepted`, `mentee_declined`, `rejected`,
	- `connected`, `expired`;
	default: `suggested`).
- `expiresAt` (Date) – Deadline for acting on this suggestion.
- `notes` (String) – Internal notes.
- `priority` (Number, 0–100, default: 0) – Priority ranking.
- `scoreBreakdown` – Component scores:
	- `expertise`, `availability`, `interactions`, `priority` (Number).
- `metadata` – Additional matching information:
	- `availabilityOverlap`, `expertiseOverlap`, `previousInteractions` (Number), `reason` (String).
- `menteeSnapshot` – Cached mentee profile at matching time (name, program, skills, expertiseAreas, interests, availabilitySlots).
- `mentorSnapshot` – Cached mentor profile (name, expertiseAreas, capacity).
- `lastNotifiedAt` (Date) – Last notification time.

**Important Indexes**

- `{ mentorId: 1, status: 1, createdAt: -1 }` – Mentor’s suggestion inbox.
- `{ mentorId: 1, applicantId: 1 }` (unique) – Single live match request per pair.
- `{ expiresAt: 1 }` – For cleanup/expiration jobs.

---

### 7. `mentorships` Collection (`Mentorship` model)

Tracks established long-term mentor–mentee relationships.

**Key Fields**

- `_id` (ObjectId) – Primary key.
- `mentorId` (ObjectId → `User`, required) – Mentor.
- `menteeId` (ObjectId → `User`, required) – Mentee.
- `matchRequestId` (ObjectId → `MatchRequest`) – Source suggestion, if any.
- `startedAt` (Date, default: now) – Start date of mentorship.
- `status` (String, enum: `active`, `paused`, `completed`, `cancelled`, default: `active`).
- `sessions[]` (ObjectId → `Session`) – Sessions conducted under this mentorship.
- `metadata` – Additional details:
	- `goals` (String), `program` (String), `notes` (String).

**Important Indexes**

- `{ mentorId: 1, status: 1 }` – Active mentees per mentor.
- `{ mentorId: 1, menteeId: 1 }` (unique) – One mentorship record per pair.

---

### 8. `notifications` Collection (`Notification` model)

Stores in-app notification entries for users.

**Key Fields**

- `_id` (ObjectId) – Primary key.
- `user` (ObjectId → `User`, required) – Recipient.
- `type` (String, required) – Notification type key (e.g. `session_reminder`, `new_message`).
- `title` (String, required) – Short title.
- `message` (String, required) – Body text.
- `data` (Object, default: `{}`) – Structured payload (e.g. IDs, URLs, context).
- `readAt` (Date) – When the user read/dismissed it.

**Important Indexes**

- `{ user: 1, createdAt: -1 }` – User’s timeline.
- `{ user: 1, readAt: 1 }` – Read/unread filters.
- `{ user: 1, createdAt: -1 }` with partial filter `{ readAt: { $exists: false } }` – Fast unread counts.
- `{ user: 1, type: 1, createdAt: -1 }` – Type-scoped queries.

---

### 9. Other Supporting Collections (High-Level)

In addition to the primary collections above, the system includes several supporting models used for auditing, content, and analytics:

- **`achievements` (`Achievement` model):** Tracks gamified achievements per user (codes, titles, levels, categories, progress, earnedAt).
- **`certificates` (`Certificate` model):** Certificates issued to users (serials, verification codes, PDF/asset metadata, QR details, issuance logs).
- **`announcements` (`Announcement` model):** System-wide announcements (title, body, summary, category, audience, publishedAt, createdBy).
- **`progresssnapshots` (`ProgressSnapshot` model):** Aggregated mentee progress metrics over time (average ratings, counts, trends, recent comments, milestones).
- **`sessionfeedbacks` (`SessionFeedback` model):** Additional structured feedback data tied to sessions, complementing `Feedback`/`MentorFeedback` when needed.
- **`auditlogs` / `adminuseractions` / `adminnotificationlogs` (`AuditLog`, `AdminUserAction`, `AdminNotificationLog`):** Auditing of admin operations, bulk notifications, and critical changes.
- **`chatthreads` / `chatmessages` (`ChatThread`, `ChatMessage`):** Real-time chat between mentors and mentees (threads, messages, read states, per-user unread counts).

These collections work together with the core `users`, `sessions`, `feedback`, `mentorfeedbacks`, `availabilities`, `matchrequests`, `mentorships`, and `notifications` collections to support the full mentoring lifecycle, from onboarding and matching through sessions, feedback, recognition, and reporting.

