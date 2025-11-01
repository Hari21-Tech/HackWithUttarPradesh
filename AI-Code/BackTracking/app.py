# app.py
import os
import io
import time
import json
import threading
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
import numpy as np
import face_recognition
from PIL import Image

from core.tracker import MultiCamTracker
from core.facial import FacialRecognition

# --- Configuration ---
DATA_DIR = "data"
BLACKLIST_FILE = os.path.join(DATA_DIR, "blacklist.json")
EMBEDDINGS_FILE = os.path.join(DATA_DIR, "embeddings.json")
LOG_FILE = os.path.join(DATA_DIR, "track_log.csv")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
MAX_FIND_TIMEOUT = 20  # seconds to wait for backtrack results

# --- Flask + SocketIO ---
app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# Ensure data dir exists
os.makedirs(DATA_DIR, exist_ok=True)

# Facial recognition / tracker singletons
facial = FacialRecognition(embeddings_file=EMBEDDINGS_FILE, faces_dir=os.path.join(DATA_DIR, "faces"))
# MultiCamTracker will be started below with an alert callback
tracker = None
tracker_thread = None


# Utility
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def image_bytes_to_rgb_array(file_bytes, max_side=800):
    # Load via PIL then convert to numpy (RGB)
    im = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    # Resize keeping aspect ratio to speed up embeddings
    w, h = im.size
    if max(w, h) > max_side:
        scale = max_side / float(max(w, h))
        im = im.resize((int(w * scale), int(h * scale)))
    arr = np.array(im)
    return arr


# Alert callback used by tracker
def on_blacklist_alert(person_id, camera_id, timestamp=None):
    if timestamp is None:
        timestamp = datetime.now().isoformat()
    payload = {
        "person_id": person_id,
        "camera": camera_id,
        "timestamp": timestamp
    }
    # Emit via socketio (clients listening on 'blacklist_alert' will get this)
    socketio.emit("blacklist_alert", payload)
    print(f"[ALERT] Blacklisted detected: {payload}")


# --- Start tracker in background thread ---
def start_tracker_background(sources=None):
    global tracker, tracker_thread
    if tracker is not None:
        return

    # If no explicit sources provided, allow overriding with env var CAMERA_SOURCES
    # Format: "0,1" or "rtsp://...,..."
    if sources is None:
        env = os.environ.get("CAMERA_SOURCES")
        if env:
            parts = [p.strip() for p in env.split(",") if p.strip()]
            parsed = []
            for p in parts:
                try:
                    parsed.append(int(p))
                except ValueError:
                    parsed.append(p)
            sources = parsed
        else:
            # default to two local cameras 0 and 1
            sources = [0, 1]

    # Instantiate MultiCamTracker and pass alert callback
    tracker = MultiCamTracker(sources=sources, log_file=LOG_FILE, alert_callback=on_blacklist_alert)
    def run():
        try:
            tracker.start()
        except Exception as e:
            print("Tracker stopped with exception:", e)
    tracker_thread = threading.Thread(target=run, daemon=True)
    tracker_thread.start()
    time.sleep(0.5)  # small warmup



# --- HTTP routes ---

@app.route("/api/blacklist", methods=["POST"])
def add_blacklist():
    """
    Add a blacklisted person.
    POST form-data:
      - name: string (required)
      - image: file (required)
    Returns 200 with saved person_id & distance threshold used
    """
    if "image" not in request.files or "name" not in request.form:
        return jsonify({"error": "missing 'name' or 'image'"}), 400

    file = request.files["image"]
    name = request.form["name"].strip()

    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "invalid or missing image file"}), 400

    try:
        img_bytes = file.read()
        rgb = image_bytes_to_rgb_array(img_bytes, max_side=800)
        # get embedding
        encodings = face_recognition.face_encodings(rgb)
        if not encodings:
            return jsonify({"error": "no face found in image"}), 400
        embedding = encodings[0].tolist()

        # Save to blacklist via FacialRecognition helper
        person_id = facial.add_to_blacklist(name, embedding)

        return jsonify({"status": "ok", "person_id": person_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/find_lost_object", methods=["POST"])
def find_lost_object():
    """
    Find lost object:
    Request JSON body (or form-data):
      - image file of the person (or multipart form 'image')
      - item_label: string
    Response: JSON with backtrack result for item_label and person
    """
    item_label = request.form.get("item_label") or request.json.get("item_label") if request.json else None
    file = request.files.get("image") or None

    if not item_label or not file:
        return jsonify({"error": "missing 'item_label' or 'image'"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "invalid image file"}), 400

    try:
        img_bytes = file.read()
        rgb = image_bytes_to_rgb_array(img_bytes, max_side=800)
        encodings = face_recognition.face_encodings(rgb)
        if not encodings:
            return jsonify({"error": "no face found in provided person image"}), 400
        person_embedding = encodings[0]

        # Find best matching registered person in embeddings.json (use facial helper)
        matched_person = facial.match_embedding(person_embedding)
        if not matched_person:
            return jsonify({"error": "person not recognized in system"}, 404)

        person_id = matched_person["id"]

        # Now query tracker's timeline for the item. We'll wait briefly if timeline is empty.
        start_t = time.time()
        timeout = MAX_FIND_TIMEOUT
        while time.time() - start_t < timeout:
            with tracker.timeline_lock:
                if item_label in tracker.object_timeline:
                    history = tracker.get_object_history(item_label)
                    # find last person who had it
                    last_person = history.get("last_person")
                    # If last_person is the person we matched, return timeline and last seen camera/time
                    return jsonify({
                        "status": "ok",
                        "requested_person": person_id,
                        "object": item_label,
                        "history": history
                    }), 200
            time.sleep(0.2)

        return jsonify({"error": "no history found for item within timeout"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/list_blacklist", methods=["GET"])
def list_blacklist():
    data = facial.load_blacklist()
    return jsonify({"blacklist": data}), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "tracker_running": tracker is not None}), 200


# SocketIO handshake
@socketio.on("connect")
def handle_connect():
    print("Client connected:", request.sid)
    emit("connected", {"message": "connected"})


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected:", request.sid)


# --- Socket.IO event handlers for frontend ---

# --- Blacklist Handlers ---

@socketio.on("blacklist:list")
def handle_blacklist_list():
    data = facial.load_blacklist()
    emit("blacklist:list:response", data)  # frontend listens for this

@socketio.on("blacklist:add")
def handle_blacklist_add(payload):
    try:
        name = payload.get("name")
        notes = payload.get("notes", "")
        image_b64 = payload.get("imageBase64")
        filename = payload.get("filename", f"{name}.jpg")

        if not name or not image_b64:
            emit("blacklist:add:response", {"error": "missing name or image"})
            return

        import base64
        from io import BytesIO

        img_bytes = base64.b64decode(image_b64.split(",")[-1])
        rgb = image_bytes_to_rgb_array(img_bytes)
        encodings = face_recognition.face_encodings(rgb)
        if not encodings:
            emit("blacklist:add:response", {"error": "no face found"})
            return

        embedding = encodings[0].tolist()
        person_id = facial.add_to_blacklist(name, embedding)

        record = {"id": person_id, "name": name, "notes": notes, "filename": filename}
        emit("blacklist:add:response", {"ok": True, "record": record})
        socketio.emit("blacklist:updated", record)
    except Exception as e:
        emit("blacklist:add:response", {"error": str(e)})


@socketio.on("blacklist:delete")
def handle_blacklist_delete(payload):
    try:
        pid = payload.get("id")
        if not pid:
            emit("blacklist:delete:response", {"error": "missing id"})
            return
        data = facial.load_blacklist()
        if pid not in data:
            emit("blacklist:delete:response", {"error": "not found"})
            return

        del data[pid]
        facial.save_blacklist(data)
        emit("blacklist:delete:response", {"ok": True})
        socketio.emit("blacklist:updated", {"deleted": pid})
    except Exception as e:
        emit("blacklist:delete:response", {"error": str(e)})


# --- Backtrace Handlers (Lost Object Requests) ---

@socketio.on("backtrace:request:list")
def handle_backtrace_list():
    # For demo, return a few fake requests until you integrate DB
    sample = [
        {"id": "req1", "person": "John Doe", "item": "bag", "status": "pending"},
        {"id": "req2", "person": "Jane Doe", "item": "phone", "status": "approved"},
    ]
    emit("backtrace:request:list:response", sample)


@socketio.on("backtrace:request:approve")
def handle_backtrace_approve(payload):
    req_id = payload.get("id")
    socketio.emit("backtrace:request:updated", {"id": req_id, "status": "approved"})


@socketio.on("backtrace:request:reject")
def handle_backtrace_reject(payload):
    req_id = payload.get("id")
    socketio.emit("backtrace:request:updated", {"id": req_id, "status": "rejected"})


@socketio.on("backtrace:request:notify")
def handle_backtrace_notify(payload):
    req_id = payload.get("id")
    socketio.emit("backtrace:request:new", {"id": req_id, "status": "new"})


if __name__ == "__main__":
    # Example: Run 2 local cameras (0 and 1)
    # You can also use RTSP streams or IP cameras like:
    # start_tracker_background(["rtsp://192.168.1.10/stream", "rtsp://192.168.1.11/stream"])
    start_tracker_background([0, 1])

    print("🚀 Flask server + MultiCamTracker running.")
    print("🟢 OpenCV windows will show live camera feeds.")
    print("🟡 Logs will be written to data/track_log.csv for all cameras.")

    # Run Flask + SocketIO server (non-blocking tracking thread)
    socketio.run(app, port=5000)