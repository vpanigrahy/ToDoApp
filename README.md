# Task Prioritization Tool

## 1.1 Overview

This project aims to create a task prioritization tool. Its purpose is to illustrate, to the user, which current tasks deserve prioritizing. The intended user could include anyone, but we believe it would be especially useful for Five College students since university students commonly have a large diversity of tasks at any time.

The relevant problem facing our future users is a difficulty in knowing which task to prioritize. A single person can be tasked with a variety of deliverables that range in importance levels, time until due, and fraction completed. Some tasks are important while not urgent, while other tasks are urgent while being relatively unimportant. Our system cuts through that confusion by recording and organizing their tasks in such a way that the task priority is optimal.

**Stakeholders** include the development team (Priority Flow) as well as the users. If we assume we are growing this as a startup and taking this to market, then the stakeholders could also include a human factors consultant and the ADA Access Group for accessibility.



## 1.2 Features

Some of the main features of the project:

- **Fast CRUD** with instant re-ranking of tasks added or deleted, based on the following strategies:
  - **Earliest Due Date (EDD):** Tackle tasks with sooner deadlines.
  - **Shortest Processing Time (SPT):** Surface tasks that can be finished quickly.
  - **Weighted Shortest Processing Time (WSPT):** Maximize value by importance ÷ estimated time.
- **Filtering options** such as **Date Range** and **Type of Priority**.
- **GUI interactions** that let users add, edit, or delete tasks.
- **Persistent storage** so the list of tasks remains saved between sessions.
- **Analytics visualizations** including:
  - **On-time completion rate** of tasks (interactive to motivate users).
  - **Cumulative Flow Diagram (CFD)** showing stacked areas of **Backlog**, **In-Progress**, and **Done** tasks.

## 2. Running the app (with PostgreSQL)

Backend requires a PostgreSQL database. Configure these environment variables (shown with defaults):

```
PGHOST=localhost
PGPORT=5432
PGDATABASE=todoapp
PGUSER=postgres
PGPASSWORD=your_password
FLASK_SECRET_KEY=dev-secret-change-me
CORS_ORIGINS=http://localhost:5173
```

Create the database once (in psql):

```sql
CREATE DATABASE todoapp;
```

Backend (Terminal 1):

```bash
cd backend
pip install -r requirements.txt
# Optionally create a .env file with the variables above
python app.py
```

Frontend (Terminal 2):

```bash
cd frontend
npm run build
npm run dev
```

Open the Vite URL (e.g., http://localhost:5173). The app expects the API at `http://localhost:5000`. If different, set `VITE_API_BASE_URL` in `frontend/.env.local`.

## 3. Authentication and Data Model

- Login page heading: "Task Management Tool". You can register or login.
- Two tables in Postgres:
  - `users(id, username, password_hash, created_at)`
  - `tasks(id, user_id, name, due_date, priority, completed, actionable_items, completion_percent, created_at)`
- Passwords are stored as secure hashes.
- All task operations are scoped to the logged-in user; CORS allows credentials.

## 4. Tasks UI

- Task creation fields: name, due date, priority (P1, P2, P3)
- Cards layout per task; toggle complete and delete
- Tasks list is sorted by earliest due date (server-side)