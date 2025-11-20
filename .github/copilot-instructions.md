# Copilot Instructions for Mentoring System

## Architecture & Boundaries
- Full MERN stack: `frontend/` (React 18 + Vite + TS) talks to `backend/` (Express + Mongoose) over REST under `/api/*`.
- Frontend data flow = React Router pages → feature components → hooks in `frontend/src/hooks|shared/hooks` using React Query for server state and Zustand stores for client-only state.
- Backend organizes business logic by domain: routers in `src/routes`, controllers in `src/controllers`, workers in `src/services`, and shared helpers in `src/utils`.
- Real-time chat/notifications rely on Pusher as configured in shared config; keep payloads consistent with `ChatThread` / `Notification` models.

## Repo Layout & Key Files
- `frontend/src/main.tsx` wires router + React Query provider; `App.tsx` handles route guards and animation wrappers.
- `frontend/src/components` & `features` host UI; follow Tailwind with mandatory `tw-` prefix (see `frontend/tailwind.config.js`).
- `frontend/src/hooks/useMaterials.ts`, `hooks/useMenteeSessions.ts`, etc. show the React Query pattern (stable `queryKey`, guard retries, invalidate caches after mutations).
- `backend/src/server.js` bootstraps Express (CORS allowlist, Helmet CSP, compression, passport auth, `/health`, worker startup). Use it to understand middleware order and error handling.
- Controllers such as `backend/src/controllers/sessionController.js`, `materialController.js`, `mentorFeedbackController.js` illustrate the standard `{ ok, fail }` response helpers from `utils/responses.js`.

## Coding Conventions
- **Frontend:** 4-space indent, 120-char limit, no inline styles; every Tailwind class must start with `tw-`. Components must handle loading/empty/error states and expose accessible markup (aria labels, focus states). Use `import.meta.env.VITE_*` for config—never hardcode secrets.
- **State:** React Query for server data (no ad-hoc fetch/axios calls inside components); Zustand stores under `frontend/src/stores` for auth/client cache. Memoize expensive selectors with `useMemo`/`useCallback` and prefer React.memo for heavy components.
- **Backend:** Always return `ok(res, data, meta)` or `fail(res, status, code, message)` from controllers; log via `utils/logger`. JWT auth enforced through `middleware/auth.js`—use it on any new route. Preserve error structure `{ success: false, code, message }` so the UI can rely on it.
- **Uploads:** Use the specialized multer middleware (`upload.js`, `uploadAvatar.js`, `uploadMaterial.js`) and store metadata in the relevant Mongoose model (e.g., `Material`). Never touch Cloudinary/Drive directly inside controllers; go through utils services.

## Developer Workflows
- Run backend: `cd backend && npm run dev` (nodemon on port 4000; `/health` confirms readiness). Run frontend: `cd frontend && npm run dev` (Vite on 5173 proxying to `/api`).
- Quality gates before PRs: `npm run lint`, `npm run typecheck`, and `npm run test` in `frontend/`; backend currently relies on targeted Jest tests inside `backend/src/__tests__` (run via `npm test` when present) plus manual smoke tests (`test-drive-upload.js`).
- Seeds/utilities: `backend npm run seed:admin` creates a bootstrap admin. Workers (`sessionReminderWorker`, `feedbackRetentionWorker`, `mentorFeedbackAggregationWorker`) auto-start with the API—simulate cron effects by running the dev server.

## Integration & Env Notes
- Frontend expects `VITE_API_URL` (defaults to `http://localhost:4000/api`) and optional `VITE_WS_URL`, `VITE_FEATURE_*` flags, reCAPTCHA site key, analytics IDs.
- Backend requires `MONGODB_URI`, `CLIENT_URLS`, `JWT_SECRET`, OAuth creds, Pusher keys, Cloudinary or Drive settings, SMTP creds, `RECAPTCHA_SECRET`; never expose these client-side.
- When adding endpoints/components, document feature flags in `PROJECT_OVERVIEW.md` or `DEPLOYMENT.md` and mirror any new response shape in shared hooks/types.

## Patterns to Emulate
- React Query hooks: `useMentorMaterials` + `useUploadSessionMaterials` show how to structure query keys, parse API responses, and invalidate caches after mutations.
- Backend controller pattern: look at `mentorFeedbackController` for how to pull `req.user`, validate ObjectIds with `Types.ObjectId.isValid`, and paginate with `limit/page`. Match this style for new domains.
- Notifications/real-time: follow `chatController` & notification services to emit consistent payloads (`chatThreadId`, `sessionId`, `type`).

Keep this file updated whenever architecture, tooling, or conventions shift. If any section feels unclear or incomplete, let me know so we can iterate. 