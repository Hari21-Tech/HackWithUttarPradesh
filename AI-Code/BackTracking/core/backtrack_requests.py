# core/backtrack_requests.py
import json, os
from datetime import datetime

DATA_PATH = "data/backtrack_requests.json"
os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)

def _load():
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, "r") as f:
        return json.load(f)

def _save(data):
    with open(DATA_PATH, "w") as f:
        json.dump(data, f, indent=2)

def create_request(person_id, object_name, image_path):
    data = _load()
    req = {
        "id": f"req_{len(data)+1}",
        "person_id": person_id,
        "object_name": object_name,
        "image_path": image_path,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "result": None
    }
    data.append(req)
    _save(data)
    return req

def update_status(req_id, status, result=None):
    data = _load()
    for r in data:
        if r["id"] == req_id:
            r["status"] = status
            if result:
                r["result"] = result
    _save(data)

def list_requests():
    return _load()
