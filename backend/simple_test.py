import os
os.environ['PGPASSWORD'] = '324005'

from db import db_cursor

try:
    with db_cursor() as cur:
        cur.execute('SELECT version()')
        version = cur.fetchone()
        print(f'SUCCESS: Connected to PostgreSQL {version[0]}')
except Exception as e:
    print(f'FAILED: {e}')