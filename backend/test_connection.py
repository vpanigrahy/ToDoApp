# Simple diagnostic script to test PostgreSQL connectivity by trying common default passwords.

import os
from db import db_cursor

# Test with common default passwords
# Loop through candidate passwords and break on first successful connection
passwords = ['postgres', 'admin', 'password', '']

for password in passwords:
    print(f"Testing with password: '{password}'")
    # Temporarily override PGPASSWORD environment variable for this attempt
    os.environ['PGPASSWORD'] = password
    try:
        with db_cursor() as cur:
            # Simple query to verify connection works
            cur.execute('SELECT 1')
            print(f"  SUCCESS with password: '{password}'")
            break
    except Exception as e:
        print(f"  FAILED with password: '{password}' - {e}")