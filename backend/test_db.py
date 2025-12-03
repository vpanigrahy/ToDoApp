# Simple connectivity test for the database connection via db_cursor context manager.
# Verifies that environment variables are loaded and the database is reachable.

import os
from dotenv import load_dotenv
# Load environment variables from .env file (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)
load_dotenv()

from db import db_cursor

# Attempt a trivial query to confirm the connection works
try:
    with db_cursor() as cur:
        cur.execute('SELECT 1')
        print('Database connection through db_cursor successful')
except Exception as e:
    print(f'Database connection failed: {e}')