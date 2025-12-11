# test_register.py

import time
from db import db_cursor
from werkzeug.security import generate_password_hash


def test_can_query_users_table():
    """
    Basic smoke test: we can query the users table without errors.
    """
    with db_cursor() as cur:
        cur.execute("SELECT 1 FROM users LIMIT 1;")
        # It's fine if there are no rows yet; we just care that the query works.
        cur.fetchone()


def test_can_register_new_user():
    """
    Insert a new user and verify it is actually stored in the database.
    Uses a unique username each run to avoid collisions.
    """
    # Use a unique username each run so we never clash with existing rows
    username = f"testuser_register_{int(time.time())}"
    raw_password = "password123"
    password_hash = generate_password_hash(raw_password)

    with db_cursor() as cur:
        # Insert the new user
        cur.execute(
            """
            INSERT INTO users (username, password_hash)
            VALUES (%s, %s)
            RETURNING id, username
            """,
            (username, password_hash),
        )
        row = cur.fetchone()
        assert row is not None
        user_id, returned_username = row

        # Basic checks on returned values
        assert user_id is not None
        assert returned_username == username

        # Verify the user is persisted and can be fetched again
        cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        fetched = cur.fetchone()
        assert fetched is not None
        assert fetched[0] == username
