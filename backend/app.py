from __future__ import annotations

from uuid import uuid4
import os

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import logging

from db import db_cursor, init_schema
import json

load_dotenv()
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
CORS(
    app,
    supports_credentials=True,
    origins=allowed_origins,
    resources={r"/api/*": {"origins": allowed_origins}},
)
app.logger.info("CORS allowed origins: %s", ", ".join(allowed_origins))

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
init_schema()
app.logger.info("Database schema ensured (tables: users, tasks)")


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
    payload = request.get_json(silent=True) or request.form or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    if not username or not password:
        return jsonify({"message": "Username and password are required."}), 400

    password_hash = generate_password_hash(password)

    try:
        with db_cursor() as cur:
            cur.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                (username, password_hash),
            )
            new_id = cur.fetchone()[0]
    except Exception as e:
        # Return the DB error for visibility while debugging registration
        return jsonify({"message": f"Registration failed: {str(e)}"}), 400

    session["user_id"] = new_id
    session["username"] = username
    return jsonify({"id": new_id, "username": username}), 201


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or request.form or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    if not username or not password:
        return jsonify({"message": "Username and password are required."}), 400

    with db_cursor() as cur:
        cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (username,))
        row = cur.fetchone()
    if not row or not check_password_hash(row[1], password):
        return jsonify({"message": "Invalid credentials."}), 401

    session["user_id"] = row[0]
    session["username"] = username
    return jsonify({"id": row[0], "username": username})


@app.post("/api/logout")
def logout():
    session.clear()
    return "", 204


@app.get("/api/tasks")
def list_tasks():
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
    if completion_percent < 0 or completion_percent > 100:
        return jsonify({"message": "completionPercent must be between 0 and 100."}), 400

    if not name or not due_date or priority not in {"P1", "P2", "P3"}:
        return jsonify({"message": "name, dueDate, and priority (P1|P2|P3) are required."}), 400

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
            return jsonify({"message": "name cannot be empty."}), 400
        fields.append("name = %s")
        values.append(name)

    if "dueDate" in payload:
        due_date = (payload.get("dueDate") or "").strip()
        if not due_date:
            return jsonify({"message": "dueDate cannot be empty."}), 400
        fields.append("due_date = %s")
        values.append(due_date)

    if "priority" in payload:
        priority = (payload.get("priority") or "").strip()
        if priority not in {"P1", "P2", "P3"}:
            return jsonify({"message": "priority must be P1, P2 or P3."}), 400
        fields.append("priority = %s")
        values.append(priority)

    if "completed" in payload:
        completed = payload.get("completed")
        if not isinstance(completed, bool):
            return jsonify({"message": "completed must be a boolean."}), 400
        fields.append("completed = %s")
        values.append(completed)

    if "actionableItems" in payload:
        items = payload.get("actionableItems") or []
        fields.append("actionable_items = %s::jsonb")
        values.append(json.dumps(items))

    if "completionPercent" in payload:
        try:
            cp = int(payload.get("completionPercent"))
        except Exception:
            return jsonify({"message": "completionPercent must be an integer."}), 400
        if cp < 0 or cp > 100:
            return jsonify({"message": "completionPercent must be between 0 and 100."}), 400
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


if __name__ == "__main__":
    app.run(debug=True)
