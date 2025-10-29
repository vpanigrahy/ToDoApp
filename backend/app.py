from __future__ import annotations

from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS

from storage import load_tasks, save_tasks

app = Flask(__name__)
CORS(app)


def _find_task(task_id: str):
    tasks = load_tasks()
    for task in tasks:
        if task["id"] == task_id:
            return task, tasks
    return None, tasks


@app.get("/api/tasks")
def list_tasks():
    tasks = load_tasks()
    return jsonify(tasks)


@app.post("/api/tasks")
def create_task():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()

    if not text:
        return jsonify({"message": "Task text is required."}), 400

    tasks = load_tasks()
    new_task = {"id": uuid4().hex, "text": text, "completed": False}
    tasks.insert(0, new_task)
    save_tasks(tasks)
    return jsonify(new_task), 201


@app.patch("/api/tasks/<task_id>")
def update_task(task_id: str):
    payload = request.get_json(silent=True) or {}

    if not {"text", "completed"} & payload.keys():
        return jsonify({"message": "Nothing to update."}), 400

    task, tasks = _find_task(task_id)
    if task is None:
        return jsonify({"message": "Task not found."}), 404

    if "text" in payload:
        text = (payload.get("text") or "").strip()
        if not text:
            return jsonify({"message": "Task text cannot be empty."}), 400
        task["text"] = text

    if "completed" in payload:
        completed = payload.get("completed")
        if not isinstance(completed, bool):
            return jsonify({"message": "Completed must be a boolean."}), 400
        task["completed"] = completed

    save_tasks(tasks)
    return jsonify(task)


@app.delete("/api/tasks/<task_id>")
def delete_task(task_id: str):
    task, tasks = _find_task(task_id)
    if task is None:
        return jsonify({"message": "Task not found."}), 404

    tasks = [item for item in tasks if item["id"] != task_id]
    save_tasks(tasks)
    return "", 204


if __name__ == "__main__":
    app.run(debug=True)
