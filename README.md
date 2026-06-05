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

## Database (SQLite → Supabase)

By default the API uses `backend/db.sqlite3`. To move to Supabase while keeping that file as backup:

1. Export a seed from SQLite (works with or without `DATABASE_URL` set):

   ```bash
   cd backend
   python manage.py export_sqlite_seed
   ```

   Writes `backend/fixtures/time_log_seed.json` (gitignored).

2. Set `DATABASE_URL` in `backend/.env` to your Supabase **URI** (real password, no placeholder brackets).

3. Apply schema and load the seed:

   ```bash
   python manage.py migrate
   python manage.py seed --force
   ```

`db.sqlite3` is not deleted. Remove `DATABASE_URL` from `.env` to run on SQLite only again.

Re-export the seed any time your local SQLite data changes, then run `seed --force` on Supabase.

## Purpose

The project helps teams keep time and activity records in one place, with a React frontend and a Django REST backend.

## Features

- Manage sheets and view sheet details
- Track repositories linked to each sheet
- View log entry runs and their related entries
- Expose REST endpoints for frontend data loading
- Check GitHub token status through an API endpoint
