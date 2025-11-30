import os
from db import db_cursor

# Test with common default passwords
passwords = ['postgres', 'admin', 'password', '']

for password in passwords:
    print(f"Testing with password: '{password}'")
    os.environ['PGPASSWORD'] = password
    try:
        with db_cursor() as cur:
            cur.execute('SELECT 1')
            print(f"  SUCCESS with password: '{password}'")
            break
    except Exception as e:
        print(f"  FAILED with password: '{password}' - {e}")