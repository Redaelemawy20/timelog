# Time Log

Time Log is a web app for tracking client work in sheets and dated sprints. It uses a React and Vite frontend, a Django REST API, and PostgreSQL (configured through `DATABASE_URL`).

## What it does

- Manage clients, their remaining hours, and sheets.
- Give each client a sheet naming pattern: manual, previous month, or `client_name_month_day`. New sheet names are suggested in the form and can be edited. A month picker is also available.
- Record sprints with date ranges, repositories, project notes, summaries, and hours. GitHub integration supplies repositories and branches; an OpenAI powered conversation can help draft sprint summaries.
- Review dashboard totals, publish a read-only sheet snapshot with a share link, and download private or shared sheets as Excel files named after the sheet.
- Sign in with a dashboard account. Shared sheet pages are public; other API endpoints require authentication.

## Run locally

You need Python, a Node.js package manager, and a PostgreSQL connection string. The app expects a database URL even for local development.

1. Create `backend/.env` using [`backend/env.example`](backend/env.example). Set `DATABASE_URL` and `SECRET_KEY`. Set `GITHUB_TOKEN` for repository features and `OPENAI_API_KEY` for summary chat.
2. Install and start the API:

   ```bash
   python -m venv .venv
   # Activate the virtual environment for your shell.
   pip install -r backend/requirements.txt
   cd backend
   python manage.py migrate
   python manage.py create_user YOUR_USERNAME YOUR_PASSWORD
   python manage.py runserver
   ```

3. In another terminal, install and start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open `http://localhost:5173` and sign in with the user you created. Vite proxies `/api` to `http://127.0.0.1:8000`, so no frontend environment variable is needed locally. For another API host, set `VITE_API_BASE` to its URL ending in `/api`.

## Deploy

The repository includes [`render.yaml`](render.yaml) for the Django API and [`frontend/vercel.json`](frontend/vercel.json) for the Vite app. Render installs backend dependencies and runs migrations during its build. Set `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, and any GitHub or OpenAI keys the deployment needs. The API health endpoint is `/api/health/`.

Deploy `frontend` on Vercel with `VITE_API_BASE` set to the Render URL ending in `/api`. Set `FRONTEND_URL` on Render to the Vercel origin so the frontend can call the API. Create a dashboard user with `python manage.py create_user YOUR_USERNAME YOUR_PASSWORD` in the backend environment.
