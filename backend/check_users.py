import os
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

from db import db_cursor

try:
    with db_cursor() as cur:
        cur.execute('SELECT id, username FROM users')
        rows = cur.fetchall()
        # Check if users were found in the database
        if rows:
            print('Existing users:')
            # Loop through and print each user
            for row in rows:
                print(f'  ID: {row[0]}, Username: {row[1]}')
        else:
            print('No existing users found')
except Exception as e:
    print(f'Error checking users: {e}')