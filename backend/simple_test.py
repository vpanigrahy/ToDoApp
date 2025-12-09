# Quick database connectivity test with a hardcoded password (for local troubleshooting only)

import os
# Directly set PGPASSWORD for this test session (overrides .env if present)
os.environ['PGPASSWORD'] = '324005'

from db import db_cursor

# Attempt connection and query PostgreSQL version to confirm setup
try:
    with db_cursor() as cur:
        cur.execute('SELECT version()')
        version = cur.fetchone()
        print(f'SUCCESS: Connected to PostgreSQL {version[0]}')
except Exception as e:
    print(f'FAILED: {e}')