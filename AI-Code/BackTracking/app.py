import os
import io
import time
import json
import threading
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename
import numpy as np
import face_recognition
from PIL import Image

from core.tracker import MultiCamTracker
from core.facial import FacialRecognition

# --- Configuration ---
DATA_DIR = "data"
BLACKLIST_DIR = os.path.join(DATA_DIR, "blacklisted_images")
os.makedirs(BLACKLIST_DIR, exist_ok=True)

EMBEDDINGS_FILE = os.path.join(DATA_DIR, "embeddings.json")
LOG_FILE = os.path.join(DATA_DIR, "track_log.csv")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
MAX_FIND_TIMEOUT = 20

# --- Flask + SocketIO ---
app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# Facial recognition & tracker
facial = FacialRecognition(embeddings_file=EMBEDDINGS_FILE, faces_dir=BLACKLIST_DIR)
tracker = None
tracker_thread = None


# --- Utilities ---
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def image_bytes_to_rgb_array(file_bytes, max_side=800):
    im = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    w, h = im.size
    if max(w, h) > max_side:
        scale = max_side / float(max(w, h))
        im = im.resize((int(w * scale), int(h * scale)))
    return np.array(im)


# --- Tracker Alert Callback ---
def on_blacklist_alert(person_id, camera_id, timestamp=None):
    if timestamp is None:
        timestamp = datetime.now().isoformat()
    payload = {
        "person_id": person_id,
        "camera": camera_id,
        "timestamp": timestamp
    }
    socketio.emit("blacklist_alert", payload)
    print(f"[ALERT] Blacklisted detected: {payload}")


# --- Tracker Thread ---
def start_tracker_background(sources=None):
    global tracker, tracker_thread
    if tracker is not None:
        return
    if sources is None:
        sources = [0]  # default single webcam
    tracker = MultiCamTracker(sources=sources, log_file=LOG_FILE, alert_callback=on_blacklist_alert)
    def run():
        try:
            tracker.start()
        except Exception as e:
            print("Tracker stopped:", e)
    tracker_thread = threading.Thread(target=run, daemon=True)
    tracker_thread.start()


# --- Routes ---
@app.route("/api/blacklist", methods=["POST"])
def add_blacklist():
    if "image" not in request.files or "name" not in request.form:
        return jsonify({"error": "missing 'name' or 'image'"}), 400

    file = request.files["image"]
    name = request.form["name"].strip()
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "invalid or missing image"}), 400

    try:
        img_bytes = file.read()
        rgb = image_bytes_to_rgb_array(img_bytes)
        encodings = face_recognition.face_encodings(rgb)
        if not encodings:
            return jsonify({"error": "no face found"}), 400
        embedding = encodings[0].tolist()

        # Add to embeddings
        person_id = facial.add_to_blacklist(name, embedding)

        # Save image locally
        filename = f"{person_id}.jpg"
        path = os.path.join(BLACKLIST_DIR, filename)
        Image.fromarray(rgb).save(path)

        return jsonify({
            "status": "ok",
            "person_id": person_id,
            "image_url": f"/static/blacklisted_images/{filename}"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/list_blacklist", methods=["GET"])
def list_blacklist():
    data = facial.load_blacklist()
    records = []
    for pid, details in data.items():
        img_path = f"/static/blacklisted_images/{pid}.jpg"
        records.append({
            "id": pid,
            "name": details.get("name", ""),
            "image_url": img_path
        })
    return jsonify(records), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "tracker_running": tracker is not None}), 200


# --- Serve images ---
@app.route("/static/blacklisted_images/<path:filename>")
def serve_blacklisted_image(filename):
    return send_from_directory(BLACKLIST_DIR, filename)


# --- SocketIO (alerts only) ---
@socketio.on("connect")
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on("disconnect")
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")


if __name__ == "__main__":
    start_tracker_background([0])
    print("🚀 Flask + MultiCamTracker running at http://localhost:5000")
    socketio.run(app, port=5000)
