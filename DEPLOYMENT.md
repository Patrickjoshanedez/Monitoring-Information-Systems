# Deployment Guide

This project ships as a classic MERN split: an Express API (`backend/`) and a Vite + React SPA (`frontend/`).
The easiest production setup keeps the services independent:

- **Backend** → Render Web Service (auto-builds from GitHub and keeps the Node server running 24/7).
- **Frontend** → Vercel Project (zero-config Vite builds with global CDN caching).

The sections below list prerequisites, environment variables, and the click-by-click steps for both services using your existing repository.

## 1. Prerequisites

1. GitHub repository (`master` branch) kept in sync with the latest code.
2. Accounts on:
   - [Render](https://render.com) for the Node API.
   - [Vercel](https://vercel.com) for the Vite frontend.
3. MongoDB Atlas cluster plus any third-party services already referenced (Pusher, Cloudinary, SMTP, reCAPTCHA, etc.).
4. Production-ready environment values (see tables below) stored securely—**never** commit them.

## 2. Backend Deployment (Render Web Service)

| Setting | Value |
| --- | --- |
| **Repository** | `Monitoring-Information-Systems` → `backend/` folder |
| **Environment** | Node 20 LTS |
| **Build Command** | `npm install` |
| **Start Command** | `npm run start` |
| **Auto-deploy** | On (triggered by pushes to `master`) |

### 2.1 Steps

1. In Render, click **New +** → **Web Service** → **Build and deploy from a Git repository**.
2. Authorize GitHub → choose the repo → set the **Root Directory** to `backend`.
3. In the service form:
   - Select **Node** runtime (20 LTS recommended).
   - Enter the commands from the table above.
   - Choose the lowest instance type that fits your traffic (Starter is fine to begin).
4. Add the environment variables listed below.
5. Click **Create Web Service** and wait for the first deploy to finish.

### 2.2 Required backend environment variables

| Variable | Description |
| --- | --- |
| `PORT` | Leave blank; Render injects one automatically. Ensure `src/server.js` reads `process.env.PORT`. |
| `MONGODB_URI` | MongoDB Atlas connection string with credentials. |
| `CLIENT_URLS` | Comma-separated list of allowed frontend origins for CORS. Example: `https://your-app.vercel.app, http://localhost:5173` |
| `JWT_SECRET` | Signing secret for auth tokens. |
| `SESSION_SECRET` | Express session secret. |
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Real-time messaging credentials. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media uploads. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | SMTP settings for `emailService`. |
| `RECAPTCHA_SECRET_KEY` | For server-side verification. |
| Any other `process.env.*` referenced in `backend/src`. Document them as you add new features. |

> **Tip:** If you need the reminder worker in `src/services/sessionReminderWorker.js`, create a separate **Background Worker** on Render that runs `node src/services/sessionReminderWorker.js` with the same environment variables.

### 2.3 Verifying the backend deploy

1. Grab the Render-provided URL (e.g., `https://mentoring-api.onrender.com`).
2. Ping a lightweight endpoint (e.g., `/api/health` if available) using `curl` or the browser.
3. Check the **Logs** tab to confirm MongoDB connects and there are no unhandled promise rejections.

## 3. Frontend Deployment (Vercel)

| Setting | Value |
| --- | --- |
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Install Command** | `npm install` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Node Version** | 18 or 20 (match backend). |

### 3.1 Steps

1. In Vercel, click **Add New…** → **Project** → import from GitHub.
2. Select the same repository, then set **Root Directory** to `frontend` when prompted.
3. Confirm the commands/output above and create the project.
4. Add the environment variables below (Project Settings → **Environment Variables**). Enable them for Production and Preview.
5. Trigger a redeploy; Vercel will build and serve the SPA globally.

### 3.2 Required frontend environment variables

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | The Render backend URL (e.g., `https://mentoring-api.onrender.com`). |
| `VITE_WS_URL` | Pusher or WebSocket endpoint, usually `wss://mentoring-api.onrender.com` or a Pusher URL. |
| `VITE_APP_NAME` | Optional branding string shown in the UI. |
| `VITE_RECAPTCHA_SITE_KEY`, `VITE_PUSHER_KEY`, etc. | Any other Vite-prefixed variables consumed in the frontend. |

> Remember: Vite exposes only variables that start with `VITE_`, so keep secrets server-side; never put private keys here.

### 3.3 Connect frontend → backend

1. After the backend deploy, copy its public HTTPS URL.
2. Save it as `VITE_API_URL` in Vercel.
3. Redeploy the frontend; the SPA now points to the Render API.

## 4. Optional local verification before pushing

Run these commands in Windows PowerShell to confirm both halves build cleanly:

```
cd backend
npm install
npm run start

# In a second terminal
cd ../frontend
npm install
npm run build
npm run preview -- --host
```

Visit `http://localhost:4173` and ensure it can talk to your local API before pushing changes.

## 5. Rollbacks and redeploys

- **Render:** Use the **Deploys** tab to roll back to any successful deploy. Each git push triggers a fresh build; disabling auto-deploy lets you gate releases.
- **Vercel:** Every git push creates a preview deployment. Promote a preview to production or roll back via **Deployments**.

## 6. Custom domains

1. Point your apex/subdomain DNS `CNAME` to Vercel for the frontend.
2. If you expose the API publicly, add a subdomain (e.g., `api.example.com`) via Render’s custom domain settings and update CORS origins accordingly.

## 7. Deployment checklist

- [ ] ENV values present on both platforms.
- [ ] MongoDB Atlas IP allowlist includes Render’s outbound IPs.
- [ ] HTTPS URLs referenced everywhere (`VITE_API_URL`, OAuth callbacks, WebSockets).
- [ ] Pusher, OAuth, and reCAPTCHA dashboards updated with the new domains.
- [ ] Monitoring/alerting enabled (Render Health Checks, Vercel Analytics, Log drains).

Following this guide, deployments become a push-to-release workflow with zero manual servers to babysit.

## 8. Troubleshooting: MongoDB TLS errors on Node 22

If you see errors like:

```
MongoNetworkError: SSL routines: ssl3_read_bytes: tlsv1 alert internal error (SSL alert number 80)
Node.js v22.x
```

Fix steps:

1) Use Node 20 LTS for the backend
- This repo pins the backend to Node 20 in `backend/package.json` via the `engines` field. Ensure your Render service respects it or set the runtime to Node 20 explicitly in the service settings.

2) Use the Atlas SRV connection string
- Prefer the `mongodb+srv://` URI from Atlas, not manual `mongodb://host:port` lists. Ensure special characters in the password are URL-encoded.

3) Network access in Atlas
- Add your Render egress IPs to the Atlas Network Access allowlist. For a quick test only, you can use `0.0.0.0/0` then tighten later.

4) Re-deploy and verify
- Redeploy the backend on Render. Check the Logs tab for a successful MongoDB connection before pointing the frontend at it.

These steps address TLS handshake issues caused by incompatibilities between Node 22’s OpenSSL and some cluster/driver configurations.