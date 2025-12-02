from __future__ import annotations

import os
import psycopg
from contextlib import contextmanager


def _get_db_dsn() -> str:
    host = os.getenv("PGHOST", "localhost")
    port = os.getenv("PGPORT", "5432")
    dbname = os.getenv("PGDATABASE", "todoapp")
    user = os.getenv("PGUSER", "postgres")
    password = os.getenv("PGPASSWORD", "")
    return f"host={host} port={port} dbname={dbname} user={user} password={password}"


@contextmanager
def db_cursor():
    with psycopg.connect(_get_db_dsn()) as conn:
        with conn.cursor() as cur:
            yield cur
            conn.commit()


def init_schema() -> None:
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
        cur.execute(create_users)
        cur.execute(create_tasks)
        # In case table existed before without actionable_items, add it
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
        # Add completion_percent if missing
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
        # Add completed_at if missing
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


