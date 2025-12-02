import os
from dotenv import load_dotenv
load_dotenv()

from db import db_cursor

try:
    with db_cursor() as cur:
        cur.execute('SELECT 1')
        print('Database connection through db_cursor successful')
except Exception as e:
    print(f'Database connection failed: {e}')