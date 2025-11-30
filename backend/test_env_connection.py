import os
from dotenv import load_dotenv
load_dotenv()

from db import db_cursor

print("Testing database connection with .env configuration...")
try:
    with db_cursor() as cur:
        cur.execute('SELECT version()')
        version = cur.fetchone()
        print(f"SUCCESS: Connected to PostgreSQL {version[0]}")
        
        # Test the schema initialization
        from db import init_schema
        init_schema()
        print("SUCCESS: Schema initialized")
        
except Exception as e:
    print(f"FAILED: {e}")