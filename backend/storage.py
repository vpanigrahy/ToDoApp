from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

DATA_FILE = Path(__file__).with_name("tasks.json")


def _ensure_data_file() -> None:
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")


def load_tasks() -> List[Dict[str, Any]]:
    _ensure_data_file()
    with DATA_FILE.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if isinstance(data, list):
        return data

    raise ValueError("Tasks file is corrupted; expected a list.")


def save_tasks(tasks: List[Dict[str, Any]]) -> None:
    DATA_FILE.write_text(
        json.dumps(tasks, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
