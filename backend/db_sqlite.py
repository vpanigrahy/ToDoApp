from __future__ import annotations

import sqlite3
import os
from contextlib import contextmanager
from typing import Any, Generator

DB_PATH = os.path.join(os.path.dirname(__file__), 'todoapp.db')

def _get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    return conn

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

def init_schema() -> None:
    create_users = """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """

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
        cur.execute(create_users)
        cur.executescript(create_tasks)
        
        # Check if actionable_items column exists, add if missing
        try:
            cur.execute("SELECT actionable_items FROM tasks LIMIT 1")
        except sqlite3.OperationalError:
            cur.execute("ALTER TABLE tasks ADD COLUMN actionable_items TEXT NOT NULL DEFAULT '[]'")
            
        # Check if completion_percent column exists, add if missing
        try:
            cur.execute("SELECT completion_percent FROM tasks LIMIT 1")
        except sqlite3.OperationalError:
            cur.execute("ALTER TABLE tasks ADD COLUMN completion_percent INTEGER NOT NULL DEFAULT 0")
            
        # Check if completed_at column exists, add if missing
        try:
            cur.execute("SELECT completed_at FROM tasks LIMIT 1")
        except sqlite3.OperationalError:
            cur.execute("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP NULL")