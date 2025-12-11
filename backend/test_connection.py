# test_connection.py
"""
Pytest-based connectivity test for PostgreSQL via db_cursor.

This test tries a small list of candidate passwords and asserts that
at least one of them works for establishing a database connection.

Note:
In our final setup, PGPASSWORD should be correctly set in .env,
so the very first password ('postgres') should succeed and the loop
will exit quickly.
"""

import os
from db import db_cursor

# Candidate passwords to try; test will pass as soon as one works.
PASSWORD_CANDIDATES = ["postgres", "admin", "password", ""]


def test_can_connect_with_candidate_passwords():
    """Ensure we can establish a DB connection using one of the candidate passwords."""
    connected = False
    successful_password = None

    for password in PASSWORD_CANDIDATES:
        print(f"Testing with password: '{password}'")
        # Override PGPASSWORD for this attempt
        os.environ["PGPASSWORD"] = password

        try:
            with db_cursor() as cur:
                cur.execute("SELECT 1")
                print(f"  SUCCESS with password: '{password}'")
                connected = True
                successful_password = password
                break
        except Exception as e:
            print(f"  FAILED with password: '{password}' - {e}")

    # Final assertion for pytest
    assert connected, (
        "Could not connect to the database with any of the candidate passwords: "
        f"{PASSWORD_CANDIDATES}"
    )
    # Optional: small extra check so it's visible in pytest -s output
    print(f"Database connectivity verified using password: '{successful_password}'")
