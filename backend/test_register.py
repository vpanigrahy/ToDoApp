from db import db_cursor
import os
from werkzeug.security import generate_password_hash

# Test database connection and user registration
try:
    with db_cursor() as cur:
        # Check existing users
        cur.execute("SELECT username FROM users")
        rows = cur.fetchall()
        print("Existing users:", [row[0] for row in rows])
        
        # Try to register a new user
        username = "myname"
        password = "password123"
        
        # Check if username already exists
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            print(f"Username '{username}' already exists")
        else:
            password_hash = generate_password_hash(password)
            cur.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                (username, password_hash),
            )
            new_id = cur.fetchone()[0]
            print(f"Successfully registered user '{username}' with ID {new_id}")
            
except Exception as e:
    print(f"Error: {e}")