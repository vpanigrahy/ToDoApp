# File-backed task storage using a single JSON file (tasks.json) next to this module.
# Note: best for local/dev and single-process use; no file locking or concurrency control.

from __future__ import annotations

# JSON serialization/deserialization for task lists
import json
# Cross-platform filesystem paths
from pathlib import Path
# Type hints for task structure
from typing import Any, Dict, List

# Path to the JSON data file stored alongside this module
DATA_FILE = Path(__file__).with_name("tasks.json")


# Ensure the data file exists; initialize to an empty list "[]"
def _ensure_data_file() -> None:
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")


# Load and return the task list from disk as List[Dict[str, Any]]
# Raises ValueError if the on-disk structure is not a JSON array
def load_tasks() -> List[Dict[str, Any]]:
    _ensure_data_file()
    with DATA_FILE.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if isinstance(data, list):
        return data

    # If the JSON is not a list, treat it as corruption to prevent silent errors
    raise ValueError("Tasks file is corrupted; expected a list.")


# Save the given task list to disk (Unicode Transformation Format-8, pretty-printed)
# Note: schema is not enforced here; callers should validate task fields
def save_tasks(tasks: List[Dict[str, Any]]) -> None:
    DATA_FILE.write_text(
        json.dumps(tasks, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
