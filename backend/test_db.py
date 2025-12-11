"""
Basic tests for database connectivity and environment configuration.

These tests verify that:
1. Required environment variables are loaded from .env
2. The db_cursor context manager can successfully execute a simple query
"""

import os
from dotenv import load_dotenv
from db import db_cursor

# Load environment variables from .env file (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)
load_dotenv()


def test_env_variables_loaded():
    """Ensure required Postgres environment variables are available."""
    required_vars = ["PGUSER", "PGDATABASE", "PGPASSWORD"]
    for var in required_vars:
        value = os.getenv(var)
        assert value is not None and value != "", f"{var} is not set in environment"


def test_db_cursor_connection():
    """Verify that db_cursor can connect and execute a trivial SELECT 1 query."""
    with db_cursor() as cur:
        cur.execute("SELECT 1")
        row = cur.fetchone()

    assert row is not None, "No row returned from SELECT 1"
    assert row[0] == 1, "SELECT 1 did not return 1"
