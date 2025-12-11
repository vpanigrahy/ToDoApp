import os
from pathlib import Path
from dotenv import load_dotenv
from db import db_cursor, init_schema

def test_env_and_schema_setup():
    base_dir = Path(__file__).resolve().parent
    env_path = base_dir / ".env"
    assert env_path.exists(), f".env not found at {env_path}"

    load_dotenv(dotenv_path=env_path)

    assert os.getenv("PGUSER"), "PGUSER not set"
    assert os.getenv("PGDATABASE"), "PGDATABASE not set"
    assert os.getenv("PGPASSWORD"), "PGPASSWORD not set"

    with db_cursor() as cur:
        cur.execute("SELECT version()")
        version = cur.fetchone()
        assert version is not None

    # Should not raise:
    init_schema()
