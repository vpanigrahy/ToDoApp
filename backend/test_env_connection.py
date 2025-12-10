# backend/test_env_connection.py

import os
from pathlib import Path
from dotenv import load_dotenv

# 1. Work out where we are and where .env *should* be
BASE_DIR = Path(__file__).resolve().parent        # backend/
env_path = BASE_DIR / ".env"

print("=== DEBUG: .env discovery ===")
print("Script file:", __file__)
print("BASE_DIR:", BASE_DIR)
print("Expected .env path:", env_path)
print("Does .env exist?", env_path.exists())

# 2. Load that exact file
load_dotenv(dotenv_path=env_path)

print("PGPASSWORD after load_dotenv:", repr(os.getenv("PGPASSWORD")))
print("PGUSER after load_dotenv:", repr(os.getenv("PGUSER")))
print("PGDATABASE after load_dotenv:", repr(os.getenv("PGDATABASE")))
print("==============================")

# 3. Now import db utilities (which also use the env vars)
from db import db_cursor, init_schema

print("Testing database connection with .env configuration...")
try:
    with db_cursor() as cur:
        cur.execute("SELECT version()")
        version = cur.fetchone()
        print(f"SUCCESS: Connected to PostgreSQL {version[0]}")

        init_schema()
        print("SUCCESS: Schema initialized")

except Exception as e:
    print(f"FAILED: {e}")
