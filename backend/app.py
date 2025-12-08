# Flask REST API for ToDoApp: session-based auth, task CRUD, analytics, and CORS-enabled frontend access.
# Postponed evaluation of annotations for Python versions < 3.10
from __future__ import annotations

# called in create_task() to generate a new UUID for each task before it’s written to the database
from uuid import uuid4
# read environment variables for FLASK_SECRET_KEY, CORS_ORIGINS, etc., via os.getenv
import os
# used for validating due dates, capturing completion timestamps, and computing analytics windows
from datetime import datetime, date, timedelta


# Flask instantiates the web object
# jsonify serializes data to JSON responses
# accesses incoming payloads/headers
# session stores the logged-in user’s ID/username
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import logging

from db import db_cursor, init_schema
import json

# Load environment variables and configure logging/app settings.
load_dotenv()
# Structured app logging; INFO by default for request/DB diagnostics.
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
app = Flask(__name__)
# Secret used to sign session cookies; ensure a strong value in production.
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
# CORS: allow frontend origins and send cookies (supports_credentials=True) for session auth.
allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
CORS(
    app,
    supports_credentials=True,
    origins=allowed_origins,
    resources={r"/api/*": {"origins": allowed_origins}},
)
app.logger.info("CORS allowed origins: %s", ", ".join(allowed_origins))

# Diagnostics: verify DB connectivity on startup and log server version.
def _log_db_connection() -> None:
    try:
        with db_cursor() as cur:
            cur.execute("SELECT current_database(), current_user")
            dbname, dbuser = cur.fetchone()
            try:
                cur.execute("SHOW server_version")
                server_version = cur.fetchone()[0]
            except Exception:
                cur.execute("SELECT version()")
                server_version = cur.fetchone()[0]
        app.logger.info(
            "Connected to Postgres | database=%s user=%s version=%s",
            dbname,
            dbuser,
            server_version,
        )
    except Exception as e:
        app.logger.error("Database connection failed: %s", str(e))

_log_db_connection()
# Ensure base schema exists and lightweight migrations have been applied.
init_schema()
app.logger.info("Database schema ensured (tables: users, tasks)")


# Helper: raises PermissionError if no logged-in user in the session cookie.
def _require_user_id() -> int:
    user_id = session.get("user_id")
    if not user_id:
        raise PermissionError("Not authenticated")
    return int(user_id)


@app.get("/api/users/<int:user_id>")
def get_user(user_id: int):
    # Public endpoint to fetch username by id (used for restoring UI state on refresh)
    with db_cursor() as cur:
        cur.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
    if not row:
        return jsonify({"message": "User not found."}), 404
    return jsonify({"id": row[0], "username": row[1]})


@app.post("/api/register")
def register():
    # Auth: create a user with validation, unique username check, and session login.
    # Set CORS headers explicitly
    origin = request.headers.get('Origin')
    allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    
    payload = request.get_json(silent=True) or request.form or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    
    # Enhanced validation
    if not username or not password:
        response = jsonify({"message": "Username and password are required."})
        response.status_code = 400
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    if len(username) < 3:
        response = jsonify({"message": "Username must be at least 3 characters long."})
        response.status_code = 400
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    if len(password) < 6:
        response = jsonify({"message": "Password must be at least 6 characters long."})
        response.status_code = 400
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    password_hash = generate_password_hash(password)

    try:
        with db_cursor() as cur:
            # Check if username already exists
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                response = jsonify({"message": f"Username '{username}' already exists. Please choose another one."})
                response.status_code = 400
                if origin and origin in allowed_origins:
                    response.headers['Access-Control-Allow-Origin'] = origin
                    response.headers['Access-Control-Allow-Credentials'] = 'true'
                return response
            
            cur.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                (username, password_hash),
            )
            new_id = cur.fetchone()[0]
    except Exception as e:
        app.logger.error(f"Registration error: {str(e)}")
        response = jsonify({"message": "Registration failed. Please try again."})
        response.status_code = 400
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    session["user_id"] = new_id
    session["username"] = username
    response = jsonify({"id": new_id, "username": username})
    response.status_code = 201
    if origin and origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response


@app.post("/api/login")
def login():
    # Auth: verify credentials, set session, and return user basics.
    # Set CORS headers explicitly
    origin = request.headers.get('Origin')
    allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    
    payload = request.get_json(silent=True) or request.form or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    if not username or not password:
        response = jsonify({"message": "Username and password are required."})
        response.status_code = 400
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    with db_cursor() as cur:
        cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (username,))
        row = cur.fetchone()
    if not row or not check_password_hash(row[1], password):
        response = jsonify({"message": "Invalid credentials."})
        response.status_code = 401
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    session["user_id"] = row[0]
    session["username"] = username
    response = jsonify({"id": row[0], "username": username})
    if origin and origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response


@app.post("/api/logout")
def logout():
    # Auth: clear the session to log out the user.
    session.clear()
    return "", 204


@app.get("/api/tasks")
def list_tasks():
    # Tasks: return all tasks for current user, ordered by due_date then created_at.
    # Dates serialized to ISO-8601 for client.
    try:
        user_id = _require_user_id()
    except PermissionError:
        return jsonify({"message": "Unauthorized"}), 401

    with db_cursor() as cur:
        cur.execute(
            """
            SELECT id::text, name, due_date, priority, completed, COALESCE(actionable_items, '[]'::jsonb), completion_percent
            FROM tasks
            WHERE user_id = %s
            ORDER BY due_date ASC, created_at ASC
            """,
            (user_id,),
        )
        rows = cur.fetchall()
    tasks = [
        {
            "id": r[0],
            "name": r[1],
            "dueDate": r[2].isoformat(),
            "priority": r[3],
            "completed": r[4],
            "actionableItems": r[5],
            "completionPercent": r[6],
        }
        for r in rows
    ]
    return jsonify(tasks)


@app.post("/api/tasks")
def create_task():
    # Tasks: validate input (name, due date not in past, priority, actionable items, completion range).
    # Inserts JSONB for actionable_items and returns the created task.
    try:
        user_id = _require_user_id()
    except PermissionError:
        return jsonify({"message": "Unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    due_date = (payload.get("dueDate") or "").strip()
    priority = (payload.get("priority") or "").strip()
    actionable_items = payload.get("actionableItems") or []
    completion_percent = int(payload.get("completionPercent") or 0)
    
    # Enhanced validation
    if not name:
        return jsonify({"message": "Task name is required and cannot be empty."}), 400
    
    if not due_date:
        return jsonify({"message": "Due date is required."}), 400
    
    # Validate due date format and check if it's in the past
    try:
        due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
        today = date.today()
        if due_date_obj < today:
            return jsonify({"message": "Due date cannot be in the past. Please select a future date."}), 400
    except ValueError:
        return jsonify({"message": "Invalid due date format. Please use YYYY-MM-DD."}), 400
    
    if priority not in {"P1", "P2", "P3"}:
        return jsonify({"message": "Priority must be P1, P2, or P3."}), 400
    
    if not actionable_items or len(actionable_items) == 0:
        return jsonify({"message": "At least one actionable item is required."}), 400
    
    if completion_percent < 0 or completion_percent > 100:
        return jsonify({"message": "Completion percent must be between 0 and 100."}), 400

    task_id = uuid4()
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO tasks (id, user_id, name, due_date, priority, actionable_items, completion_percent)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s)
            RETURNING id::text, name, due_date, priority, completed, actionable_items, completion_percent
            """,
            (str(task_id), user_id, name, due_date, priority, json.dumps(actionable_items), completion_percent),
        )
        row = cur.fetchone()
    new_task = {
        "id": row[0],
        "name": row[1],
        "dueDate": row[2].isoformat(),
        "priority": row[3],
        "completed": row[4],
        "actionableItems": row[5],
        "completionPercent": row[6],
    }
    return jsonify(new_task), 201


@app.patch("/api/tasks/<task_id>")
def update_task(task_id: str):
    # Tasks: partial update; handles completed_at when toggling completion.
    # Validates due date format and bounds for completionPercent.
    try:
        user_id = _require_user_id()
    except PermissionError:
        return jsonify({"message": "Unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    fields = []
    values = []

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return jsonify({"message": "Task name cannot be empty."}), 400
        fields.append("name = %s")
        values.append(name)

    if "dueDate" in payload:
        due_date = (payload.get("dueDate") or "").strip()
        if not due_date:
            return jsonify({"message": "Due date cannot be empty."}), 400
        
        # Validate due date is not in the past
        try:
            due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
            today = date.today()
            if due_date_obj < today:
                return jsonify({"message": "Due date cannot be in the past. Please select a future date."}), 400
        except ValueError:
            return jsonify({"message": "Invalid due date format. Please use YYYY-MM-DD."}), 400
        
        fields.append("due_date = %s")
        values.append(due_date)

    if "priority" in payload:
        priority = (payload.get("priority") or "").strip()
        if priority not in {"P1", "P2", "P3"}:
            return jsonify({"message": "Priority must be P1, P2, or P3."}), 400
        fields.append("priority = %s")
        values.append(priority)

    if "completed" in payload:
        completed = payload.get("completed")
        if not isinstance(completed, bool):
            return jsonify({"message": "Completed must be a boolean value."}), 400
        fields.append("completed = %s")
        values.append(completed)
        
        # Set completed_at timestamp when marking as complete
        if completed:
            fields.append("completed_at = %s")
            values.append(datetime.now())
        else:
            # Clear completed_at if unmarking as complete
            fields.append("completed_at = %s")
            values.append(None)

    if "actionableItems" in payload:
        items = payload.get("actionableItems") or []
        if not items or len(items) == 0:
            return jsonify({"message": "At least one actionable item is required."}), 400
        fields.append("actionable_items = %s::jsonb")
        values.append(json.dumps(items))

    if "completionPercent" in payload:
        try:
            cp = int(payload.get("completionPercent"))
        except Exception:
            return jsonify({"message": "Completion percent must be an integer."}), 400
        if cp < 0 or cp > 100:
            return jsonify({"message": "Completion percent must be between 0 and 100."}), 400
        fields.append("completion_percent = %s")
        values.append(cp)

    if not fields:
        return jsonify({"message": "Nothing to update."}), 400

    values.extend([user_id, task_id])
    with db_cursor() as cur:
        cur.execute(
            f"UPDATE tasks SET {', '.join(fields)} WHERE user_id = %s AND id = %s RETURNING id::text, name, due_date, priority, completed, COALESCE(actionable_items,'[]'::jsonb), completion_percent",
            tuple(values),
        )
        row = cur.fetchone()
    if not row:
        return jsonify({"message": "Task not found."}), 404

    task = {
        "id": row[0],
        "name": row[1],
        "dueDate": row[2].isoformat(),
        "priority": row[3],
        "completed": row[4],
        "actionableItems": row[5],
        "completionPercent": row[6],
    }
    return jsonify(task)


@app.delete("/api/tasks/<task_id>")
def delete_task(task_id: str):
    # Tasks: delete by id for current user; 404 if not found.
    try:
        user_id = _require_user_id()
    except PermissionError:
        return jsonify({"message": "Unauthorized"}), 401

    with db_cursor() as cur:
        cur.execute("DELETE FROM tasks WHERE user_id = %s AND id = %s", (user_id, task_id))
        deleted = cur.rowcount
    if deleted == 0:
        return jsonify({"message": "Task not found."}), 404
    return "", 204


# ==================== ANALYTICS ENDPOINTS ====================
# Metrics derived from tasks (completed_on_time, averages, streaks, CFD).

@app.get("/api/analytics/summary")
def analytics_summary():
    """Get analytics summary: total completed, on-time rate, average completion time"""
    try:
        user_id = _require_user_id()
    except PermissionError:
        return jsonify({"message": "Unauthorized"}), 401
    
    # Get days parameter (default 30)
    days = request.args.get('days', 30, type=int)
    
    with db_cursor() as cur:
        # Get completed tasks in the time window
        cur.execute(
            """
            SELECT 
                COUNT(*) as total_completed,
                COUNT(CASE WHEN DATE(completed_at) <= due_date THEN 1 END) as completed_on_time,
                AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) AS avg_completion_seconds
            FROM tasks
            WHERE user_id = %s 
                AND completed = true 
                AND completed_at IS NOT NULL
                AND completed_at >= NOW() - INTERVAL '%s days'
            """,
            (user_id, days)
        )
        row = cur.fetchone()
        
        total_completed = row[0] or 0
        completed_on_time = row[1] or 0
        avg_completion_seconds = float(row[2]) if row[2] is not None else 0.0

        # Convert seconds → minutes / hours / days
        avg_completion_minutes = avg_completion_seconds / 60.0
        avg_completion_hours = avg_completion_seconds / 3600.0
        avg_completion_days = avg_completion_seconds / 86400.0
        
        on_time_rate = (
            completed_on_time / total_completed if total_completed > 0 else 0.0
        )
        
        # Get tasks completed this week
        cur.execute(
            """
            SELECT COUNT(*)
            FROM tasks
            WHERE user_id = %s 
                AND completed = true
                AND completed_at >= NOW() - INTERVAL '7 days'
            """,
            (user_id,)
        )
        tasks_this_week = cur.fetchone()[0] or 0
    
    return jsonify({
        "total_completed": total_completed,
        "completed_on_time": completed_on_time,
        "on_time_rate": round(on_time_rate, 2),
        "avg_completion_days": avg_completion_days,
        "avg_completion_hours": round(avg_completion_hours, 2),
        "avg_completion_minutes": round(avg_completion_minutes, 2),
        "tasks_completed_this_week": tasks_this_week,
        "time_window_days": days
    })


@app.get("/api/analytics/streak")
def analytics_streak():
    # Streak: counts consecutive days with at least one on-time completion.
    """Calculate on-time completion streak (optional feature)"""
    try:
        user_id = _require_user_id()
    except PermissionError:
        return jsonify({"message": "Unauthorized"}), 401
    
    # Get completed tasks ordered by completion date
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT 
                DATE(completed_at) as completion_date,
                CASE 
                    WHEN DATE(completed_at) <= due_date THEN true
                    ELSE false
                END as on_time
            FROM tasks
            WHERE user_id = %s 
                AND completed = true
                AND completed_at IS NOT NULL
            ORDER BY completed_at DESC
            LIMIT 365
            """,
            (user_id,)
        )
        rows = cur.fetchall()
    
    if not rows:
        return jsonify({"on_time_streak_days": 0, "current_streak": False})
    
    # Group by date and check if at least one task was completed on-time each day
    from collections import defaultdict
    daily_on_time = defaultdict(bool)
    
    for row in rows:
        completion_date = row[0]
        on_time = row[1]
        # If any task on this day was on-time, mark the day as on-time
        if on_time:
            daily_on_time[completion_date] = True
    
    # Create sorted list of dates
    sorted_dates = sorted(daily_on_time.keys(), reverse=True)
    
    # Calculate current streak
    streak = 0
    today = date.today()
    expected_date = today
    
    for completion_date in sorted_dates:
        # Allow 1 day gap tolerance
        if (expected_date - completion_date).days <= 1:
            if daily_on_time[completion_date]:
                streak += 1
                expected_date = completion_date - timedelta(days=1)
            else:
                break
        else:
            break
    
    return jsonify({
        "on_time_streak_days": streak,
        "current_streak": streak > 0
    })


@app.get("/api/analytics/cfd")
def analytics_cfd():
    # CFD: bucket tasks per day into backlog/in_progress/done over a rolling window.
    """Get Cumulative Flow Diagram data"""
    try:
        user_id = _require_user_id()
    except PermissionError:
        return jsonify({"message": "Unauthorized"}), 401
    
    days = request.args.get('days', 30, type=int)
    
    with db_cursor() as cur:
        # Get all tasks for the user
        cur.execute(
            """
            SELECT 
                id,
                created_at,
                completed,
                completed_at,
                completion_percent
            FROM tasks
            WHERE user_id = %s
            ORDER BY created_at
            """,
            (user_id,)
        )
        tasks = cur.fetchall()
    
    # Generate data for each day
    from datetime import timedelta
    
    today = date.today()
    start_date = today - timedelta(days=days-1)
    
    cfd_data = []
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        backlog = 0
        in_progress = 0
        done = 0
        
        for task in tasks:
            task_created = task[1].date() if task[1] else None
            task_completed_at = task[3].date() if task[3] else None
            completion_percent = task[4] or 0
            
            # Skip if task not created yet on this date
            if not task_created or task_created > current_date:
                continue
            
            # Check status on this date (per spec in Screenshot 4)
            # If completed_at <= D → Done
            if task_completed_at and task_completed_at <= current_date:
                done += 1
            # Else if created_at <= D and completion_percent > 0 → In-Progress
            elif completion_percent > 0:
                in_progress += 1
            # Else if created_at <= D and completion_percent == 0 → Backlog
            else:
                backlog += 1
        
        cfd_data.append({
            "date": current_date.isoformat(),
            "backlog": backlog,
            "in_progress": in_progress,
            "done": done
        })
    
    return jsonify(cfd_data)


@app.get("/api/completed-tasks")
def completed_tasks():
    """Get completed tasks with on-time/late status"""
    try:
        user_id = _require_user_id()
    except PermissionError:
        return jsonify({"message": "Unauthorized"}), 401
    
    # Get filter parameter (default: last year)
    days = request.args.get('days', 365, type=int)
    
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT 
                id::text,
                name,
                due_date,
                priority,
                completed_at,
                CASE 
                    WHEN DATE(completed_at) <= due_date THEN true
                    ELSE false
                END as on_time
            FROM tasks
            WHERE user_id = %s 
                AND completed = true
                AND completed_at IS NOT NULL
                AND completed_at >= NOW() - (%s::int) * INTERVAL '1 day'
            ORDER BY completed_at DESC
            """,
            (user_id, days)
        )
        rows = cur.fetchall()
    
    tasks = [
        {
            "id": r[0],
            "name": r[1],
            "dueDate": r[2].isoformat(),
            "priority": r[3],
            "completedAt": r[4].isoformat() if r[4] else None,
            "onTime": r[5]
        }
        for r in rows
    ]
    
    return jsonify(tasks)


@app.get("/api/test")
def test_connection():
    # Health/CORS probe: echoes origin and sets credentials headers if allowed.
    origin = request.headers.get('Origin')
    allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    
    response = jsonify({"message": "Connection successful", "origin": origin})
    if origin and origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response


if __name__ == "__main__":
    # Dev server only; use a production WSGI (e.g., gunicorn) for deployment.
    app.run(debug=True, port=5000)
