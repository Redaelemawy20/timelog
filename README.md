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

## Purpose

The project helps teams keep time and activity records in one place, with a React frontend and a Django REST backend.

## Features

- Manage sheets and view sheet details
- Track repositories linked to each sheet
- View log entry runs and their related entries
- Expose REST endpoints for frontend data loading
- Check GitHub token status through an API endpoint
