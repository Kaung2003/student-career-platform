# Student Career Platform

Portfolios, certification tracking, and AI interview practice for students and new graduates.

- **Frontend:** React + Vite + Tailwind (`frontend/`) — deployed on **Netlify**
- **Backend:** Express + Prisma + PostgreSQL (`backend/`) — deployed on **Render**
- **Languages:** English, 日本語, 中文, Español, Deutsch, မြန်မာ — switch from the header or sidebar; AI replies follow the chosen language

### Adding or editing translations

All UI text lives in `frontend/src/i18n/locales/`. `en.ts` is the source of truth; every other locale is typed against it, so `npm run build` fails if a key is missing. Use `t("key", { name })` in components and `{placeholders}` in strings.

## Local development

```bash
cd backend && cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npm install && npm run db:push && npm run db:seed && npm run dev
```

```bash
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxies /api to :4000)
```

## Deployment

### 1. Backend + database on Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, pick this repo. `render.yaml` creates:
   - `student-career-platform-backend` (Node web service, root `backend/`)
   - `student-career-platform-db` (PostgreSQL)
3. When prompted, set `GEMINI_API_KEY`, `CORS_ORIGIN` (your Netlify URL) and, optionally, the `R2_*` upload keys. `JWT_SECRET` and `DATABASE_URL` are filled in automatically.
4. Each deploy builds the API, syncs the schema (`prisma db push`) and seeds interview questions.
5. Check `https://<your-service>.onrender.com/health` returns `{"status":"ok"}`.

### 2. Frontend on Netlify

1. In Netlify: **Add new site → Import from Git**, pick this repo. `netlify.toml` (repo root) sets base `frontend/`, build `npm run build`, publish `dist`.
2. If Render assigned a different URL than `student-career-platform-backend.onrender.com`, update the `/api/*` redirect in `netlify.toml`.
3. Deploy. Netlify proxies `/api/*` to Render, so the frontend and API share one origin.

> Render's free plan sleeps after inactivity — the first request after a pause can take ~30–60s.
