# Enables better type hinting
from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path

import psycopg
from dotenv import dotenv_values


# --- Locate backend/.env regardless of where Python is run from ---
BASE_DIR = Path(__file__).resolve().parent      # this is the backend/ folder
ENV_PATH = BASE_DIR / ".env"

# Load values directly from .env (DOES NOT depend on external env)
CONFIG = dotenv_values(ENV_PATH)

#print("=== db.py DEBUG ===")
print("Using .env at:", ENV_PATH)
print(".env exists?:", ENV_PATH.exists())
print("CONFIG['PGUSER']:", repr(CONFIG.get("PGUSER")))
print("CONFIG['PGDATABASE']:", repr(CONFIG.get("PGDATABASE")))
print("CONFIG['PGPASSWORD']:", repr(CONFIG.get("PGPASSWORD")))
print("====================")


def _get_db_dsn() -> str:
    """
    Build the PostgreSQL DSN.

    Priority:
    1. Values from backend/.env (CONFIG)
    2. Fallback to process environment variables
    3. Finally fallback to safe defaults
    """
    host = CONFIG.get("PGHOST") or os.getenv("PGHOST", "localhost")
    port = CONFIG.get("PGPORT") or os.getenv("PGPORT", "5432")
    dbname = CONFIG.get("PGDATABASE") or os.getenv("PGDATABASE", "todoapp")
    user = CONFIG.get("PGUSER") or os.getenv("PGUSER", "postgres")
    password = CONFIG.get("PGPASSWORD") or os.getenv("PGPASSWORD", "")

    dsn = f"host={host} port={port} dbname={dbname} user={user} password={password}"
    #print("db_cursor will use DSN:", dsn)  
    
    return dsn


@contextmanager
def db_cursor():
    """
    Context manager for database operations with automatic connection management and commit.
    """
    dsn = _get_db_dsn()
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            yield cur
            conn.commit()


def init_schema() -> None:
    """
    Creates database tables if they don't exist and adds any missing columns to existing tables.
    """

    # SQL to create users table with authentication fields
    create_users = (
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )

    # SQL to create tasks table with all task properties and foreign key to users
    create_tasks = (
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            due_date DATE NOT NULL,
            priority TEXT NOT NULL CHECK (priority IN ('P1','P2','P3')),
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            actionable_items JSONB NOT NULL DEFAULT '[]',
            completion_percent INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks (user_id, due_date);
        """
    )

    with db_cursor() as cur:
        # Create base tables
        cur.execute(create_users)
        cur.execute(create_tasks)

        # Ensure actionable_items exists
        cur.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'tasks' AND column_name = 'actionable_items'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN actionable_items JSONB NOT NULL DEFAULT '[]';
                END IF;
            END$$;
            """
        )

        # Ensure completion_percent exists
        cur.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'tasks' AND column_name = 'completion_percent'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN completion_percent INTEGER NOT NULL DEFAULT 0;
                END IF;
            END$$;
            """
        )

        # Ensure completed_at exists
        cur.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'tasks' AND column_name = 'completed_at'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ NULL;
                END IF;
            END$$;
            """
        )
        # Add total_time if missing
        cur.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'tasks' AND column_name = 'total_time'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN total_time INTEGER NOT NULL DEFAULT 1;
                END IF;
            END$$;
            """
        )


