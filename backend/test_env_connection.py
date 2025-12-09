# Comprehensive database test: verifies .env configuration, connectivity, version, and schema initialization.
# Can be used for validating a fresh setup or troubleshooting database issues.

import os
from dotenv import load_dotenv
# Load database credentials from .env file in the project root
load_dotenv()

from db import db_cursor

print("Testing database connection with .env configuration...")
try:
    with db_cursor() as cur:
        # Query PostgreSQL version to confirm connection and server details
        cur.execute('SELECT version()')
        version = cur.fetchone()
        print(f"SUCCESS: Connected to PostgreSQL {version[0]}")
        
        # Test the schema initialization
        # Ensures users and tasks tables exist with all required columns
        from db import init_schema
        init_schema()
        print("SUCCESS: Schema initialized")
        
except Exception as e:
    print(f"FAILED: {e}")