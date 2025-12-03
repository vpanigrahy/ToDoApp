# SQLite backend: creates schema and applies lightweight migrations for missing columns.
# Note: This file targets local/dev usage; SQLite is file-based and portable for simple setups.

from __future__ import annotations

# Built-in SQLite driver
import sqlite3
# Access to environment / filesystem for DB file location
import os
# Helper to build context managers
from contextlib import contextmanager
# Typing support for generator return
from typing import Any, Generator

# Absolute path to local SQLite database file
# The DB file will be created on first connection if it does not exist.
DB_PATH = os.path.join(os.path.dirname(__file__), 'todoapp.db')

# Opens a connection and sets row_factory for dict-like column access
def _get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    # To convert rows to dicts later: dict(row) for row in cursor.fetchall()
    return conn

# Context manager: yields cursor, commits on success, rolls back on failure
# Each call opens a fresh connection
@contextmanager
def db_cursor() -> Generator[sqlite3.Cursor, None, None]:
    conn = _get_db_connection()
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

# Initialize tables if absent; add new columns if an older schema is detected
def init_schema() -> None:
    # DDL for users table
    create_users = """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """

    # DDL for tasks table (includes index creation)
    # - actionable_items stored as JSON string (TEXT) for compatibility.
    # - completed BOOLEAN maps to INTEGER 0/1 in SQLite.
    # - FOREIGN KEY requires PRAGMA foreign_keys=ON to enforce cascades.
    # - idx_tasks_user_due speeds queries filtering by (user_id, due_date).
    create_tasks = """
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        due_date DATE NOT NULL,
        priority TEXT NOT NULL CHECK (priority IN ('P1','P2','P3')),
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        actionable_items TEXT NOT NULL DEFAULT '[]',
        completion_percent INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks (user_id, due_date);
    """

    with db_cursor() as cur:
        # Create base tables (idempotent)
        cur.execute(create_users)
        # executescript is used to run multiple statements (table + index) at once.
        cur.executescript(create_tasks)
        
        # Check if actionable_items column exists, add if missing
        # Stored as JSON-encoded TEXT; callers should json.dumps/loads.
        try:
            cur.execute("SELECT actionable_items FROM tasks LIMIT 1")
        except sqlite3.OperationalError:
            cur.execute("ALTER TABLE tasks ADD COLUMN actionable_items TEXT NOT NULL DEFAULT '[]'")
            
        # Check if completion_percent column exists, add if missing
        # Expected to be in range 0..100; application logic should enforce bounds.
        try:
            cur.execute("SELECT completion_percent FROM tasks LIMIT 1")
        except sqlite3.OperationalError:
            cur.execute("ALTER TABLE tasks ADD COLUMN completion_percent INTEGER NOT NULL DEFAULT 0")
            
        # Check if completed_at column exists, add if missing
        # NULL indicates task is not yet completed.
        try:
            cur.execute("SELECT completed_at FROM tasks LIMIT 1")
        except sqlite3.OperationalError:
            cur.execute("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP NULL")