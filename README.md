# Time Log

Time Log is a lightweight app for organizing sheets and tracking work log entries by period, project, and repository.

## Run

Start the Django API, then the Vite app (`/api` is proxied to the backend).

```bash
cd backend && python manage.py runserver
```

```bash
cd frontend && pnpm dev
```

First time only: `pip install -r backend/requirements.txt` (prefer a venv), `pnpm install` in `frontend`.

## Supabase MCP (Cursor)

Copy `mcp.json.example` to `.cursor/mcp.json` (or merge into your existing file). The hosted server uses OAuth — no personal access token in the file.

1. **Cursor Settings → Tools & MCP** — enable **supabase** and complete login when prompted.
2. Do **not** add `project_ref` to the URL until a project exists; account tools (`create_project`, etc.) need the org-wide URL above.
3. After the project exists, you can scope with `https://mcp.supabase.com/mcp?project_ref=YOUR_REF`.

PAT fallback (CI only): set `SUPABASE_ACCESS_TOKEN` and use `Authorization: Bearer ${env:SUPABASE_ACCESS_TOKEN}` in `headers`. Create tokens at https://supabase.com/dashboard/account/tokens

## Database (Supabase)

Set `DATABASE_URL` in `backend/.env` to your Supabase PostgreSQL URI (see `backend/env.example`).

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Optional backup/restore via JSON seed:

```bash
python manage.py export_seed    # writes fixtures/time_log_seed.json
python manage.py seed --force   # reload seed into the database
```

## Deploy (Vercel + Render)

**Backend (Render)** — set root directory to `backend`, or deploy from repo root with `render.yaml` (Blueprint).

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | Supabase URI (session pooler, port 5432) |
| `SECRET_KEY` | Random string (Render can generate) |
| `GITHUB_TOKEN` | GitHub PAT |
| `OPENAI_API_KEY` | OpenAI key |
| `FRONTEND_URL` | Vercel app URL, e.g. `https://your-app.vercel.app` |
| `DEBUG` | `false` |

Health check: `/api/health/`

**Frontend (Vercel)** — set root directory to `frontend`.

| Variable | Required |
|----------|----------|
| `VITE_API_BASE` | Render API base, e.g. `https://your-service.onrender.com/api` |

Build command: `pnpm build` (install: `pnpm install`). No env var needed locally if you use the Vite `/api` proxy.

## Purpose

The project helps teams keep time and activity records in one place, with a React frontend and a Django REST backend.

## Features

- Manage sheets and view sheet details
- Track repositories linked to each sheet
- View log entry runs and their related entries
- Expose REST endpoints for frontend data loading
- Check GitHub token status through an API endpoint
