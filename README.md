# Student Career Platform

Portfolios, certification tracking, and AI interview practice for students and new graduates.

- **Frontend:** React + Vite + Tailwind (`frontend/`) — deployed on **Netlify**
- **Backend:** Express + Prisma + PostgreSQL (`backend/`) — deployed on **Render**
- **Languages:** English, 日本語, 中文, Español, Deutsch, မြန်မာ — switch from the header or sidebar; AI replies follow the chosen language

### Adding or editing translations

All UI text lives in `frontend/src/i18n/locales/`. `en.ts` is the source of truth; every other locale is typed against it, so `npm run build` fails if a key is missing. Use `t("key", { name })` in components and `{placeholders}` in strings.

## Local development

```bash
docker compose up -d                 # local Postgres (dev + test databases)
cd backend && cp .env.example .env   # set DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npm install && npm run db:migrate && npm run db:seed && npm run dev
```

```bash
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxies /api to :4000)
```

### Tests and checks

```bash
cd backend && TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/career_test npm test
cd frontend && npm test && npm run lint && npm run build
```

GitHub Actions (`.github/workflows/ci.yml`) runs all of these on every push and pull request.

### Database changes

Edit `backend/prisma/schema.prisma`, then run `npm run db:migrate:dev -- --name describe_change` to create a migration.
Commit the new folder in `prisma/migrations/`. Deploys apply pending migrations with `npm run db:migrate`.

## Security model

- Sessions are an httpOnly, SameSite=Lax cookie (not readable by JavaScript); role and suspension are re-checked on every request.
- All request bodies are validated with zod; links must be http(s).
- Rate limits on login, sign-up, password reset and AI endpoints; `helmet` security headers.
- Admin actions are written to an audit log (`/admin/audit`).

## Deployment

### 1. Backend + database on Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, pick this repo. `render.yaml` creates:
   - `student-career-platform-backend` (Node web service, root `backend/`)
   - `student-career-platform-db` (PostgreSQL)
3. When prompted, set `GEMINI_API_KEY`, `APP_URL` (your Netlify URL), `ADMIN_EMAILS`, and optionally `RESEND_API_KEY` + `EMAIL_FROM` (password-reset emails) and the `R2_*` upload keys. `JWT_SECRET` and `DATABASE_URL` are filled in automatically.
4. Each deploy builds the API, applies database migrations (`npm run db:migrate`) and seeds interview questions.
5. Check `https://<your-service>.onrender.com/health` returns `{"status":"ok"}`.

### 2. Frontend on Netlify

1. In Netlify: **Add new site → Import from Git**, pick this repo. `netlify.toml` (repo root) sets base `frontend/`, build `npm run build`, publish `dist`.
2. If Render assigned a different URL than `student-career-platform-backend.onrender.com`, update the `/api/*` redirect in `netlify.toml`.
3. Deploy. Netlify proxies `/api/*` to Render, so the frontend and API share one origin.

> Render's free plan sleeps after inactivity — the first request after a pause can take ~30–60s.
