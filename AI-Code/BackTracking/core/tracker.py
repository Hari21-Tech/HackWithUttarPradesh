# core/tracker.py
import cv2, csv, os, threading
import face_recognition
import numpy as np
from datetime import datetime
from core.facial import FacialRecognition
from core.yolo_detector import ObjectDetector


class MultiCamTracker:
    def __init__(self, sources=[0], log_file="data/track_log.csv", alert_callback=None):
        self.sources = sources
        self.facial = FacialRecognition()
        self.object_detector = ObjectDetector()
        self.log_file = log_file
        self.cams = [cv2.VideoCapture(src) for src in sources]
        
        # Initialize tracking state
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        self.current_state = {}
        self.object_timeline = {}
        self.proximity_threshold = 200
        self.abandon_timeout = 30  # seconds

        # Concurrency
        self.timeline_lock = threading.Lock()
        self.alert_callback = alert_callback  # function(person_id, camera_id, timestamp_iso_opt)

        # Create log file with header if not exists
        if not os.path.exists(log_file):
            with open(log_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["timestamp", "camera", "event_type", "details"])

    # -------------------------------------------------------------------------
    # Logging + Object Timeline
    # -------------------------------------------------------------------------
    def log_change(self, camera_id, event_type, details):
        timestamp = datetime.now()
        timestamp_str = timestamp.strftime("%d-%m-%Y %H:%M:%S.%f")

        with self.timeline_lock:
            # Parse and record different event types
            if event_type in ("objects_with_person", "objects_removed"):
                if ": " not in details:
                    return
                person_id, objects_str = details.split(": ", 1)
                objects = [o.strip() for o in objects_str.split(",") if o.strip()]
                event_name = "picked_up" if event_type == "objects_with_person" else "removed_from_person"

                for obj in objects:
                    self._append_timeline(obj, {
                        "timestamp": timestamp,
                        "event": event_name,
                        "person": person_id,
                        "camera": camera_id
                    })

            elif event_type in ("objects_abandoned", "abandoned_objects_picked"):
                objects = [o.strip() for o in details.split(",") if o.strip()]
                event_name = "abandoned" if event_type == "objects_abandoned" else "picked_from_abandoned"

                for obj in objects:
                    self._append_timeline(obj, {
                        "timestamp": timestamp,
                        "event": event_name,
                        "person": None,
                        "camera": camera_id
                    })

        # Write to CSV log
        with open(self.log_file, 'a', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([timestamp_str, camera_id, event_type, details])

    def _append_timeline(self, obj, record):
        if obj not in self.object_timeline:
            self.object_timeline[obj] = []
        self.object_timeline[obj].append(record)

    # -------------------------------------------------------------------------
    # Object History Retrieval
    # -------------------------------------------------------------------------
    def get_object_history(self, object_label):
        """Return full history of an object including current status."""
        if object_label not in self.object_timeline:
            return None

        history = self.object_timeline[object_label]
        if not history:
            return None

        last_person = None
        for event in reversed(history):
            if event["person"] is not None:
                last_person = event["person"]
                break

        current_status = history[-1]["event"]
        current_camera = history[-1]["camera"]

        formatted_timeline = []
        for event in history:
            ts = event["timestamp"].strftime("%d-%m-%Y %H:%M:%S")
            if event["person"]:
                formatted_timeline.append(
                    f"{ts}: {event['event']} by {event['person']} on camera {event['camera']}"
                )
            else:
                formatted_timeline.append(f"{ts}: {event['event']} on camera {event['camera']}")

        return {
            "object": object_label,
            "last_person": last_person,
            "current_status": current_status,
            "current_camera": current_camera,
            "timeline": formatted_timeline
        }

    # -------------------------------------------------------------------------
    # Main Tracking Loop
    # -------------------------------------------------------------------------
    def start(self):
        print("🟢 Multi-camera tracking started. Press 'q' to quit.")
        threads = []
        for i, cam in enumerate(self.cams):
            t = threading.Thread(target=self.process_camera, args=(i, cam))
            t.daemon = True
            t.start()
            threads.append(t)

        try:
            while True:
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
        finally:
            for cam in self.cams:
                cam.release()
            cv2.destroyAllWindows()

    def process_camera(self, camera_id, cap):
        self.current_state.setdefault(camera_id, {
            "person": None,
            "objects": set(),
            "abandoned": set()
        })

        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                print(f"⚠️  Failed to read frame from camera {camera_id}")
                continue

            # Detect faces & objects
            face_locations = face_recognition.face_locations(frame)
            objects = self.object_detector.detect(frame)

            current_objects = set(obj['label'] for obj in objects)
            current_person = None
            current_person_objects = set()

            # Process detected faces
            for face_location in face_locations:
                try:
                    encoding = face_recognition.face_encodings(frame, [face_location])[0]
                    person_id = self.facial.recognize_or_register(encoding, frame, face_location)
                    if not person_id:
                        continue

                    current_person = person_id

                    # Check blacklist
                    entry, dist = self.facial.is_embedding_blacklisted(encoding)
                    if entry and self.alert_callback:
                        self.alert_callback(entry.get("id", person_id), camera_id, datetime.now().isoformat())

                    # Associate nearby objects
                    for obj in objects:
                        if self.is_near(face_location, obj["bbox"]):
                            current_person_objects.add(obj['label'])
                except Exception as e:
                    print(f"Error processing face in camera {camera_id}: {e}")

            # Abandoned = all objects not with current person
            current_abandoned = current_objects - current_person_objects
            prev_state = self.current_state[camera_id]

            # Person appeared or left
            if current_person != prev_state["person"]:
                if current_person is None and prev_state["person"]:
                    self.log_change(camera_id, "person_left", prev_state["person"])
                elif current_person:
                    self.log_change(camera_id, "person_detected", current_person)

            # New or removed objects
            new_objects = current_person_objects - prev_state["objects"]
            removed_objects = prev_state["objects"] - current_person_objects
            if new_objects:
                self.log_change(camera_id, "objects_with_person", f"{current_person}: {', '.join(new_objects)}")
            if removed_objects:
                self.log_change(camera_id, "objects_removed", f"{current_person}: {', '.join(removed_objects)}")

            # Abandoned object updates
            new_abandoned = current_abandoned - prev_state["abandoned"]
            picked_up_abandoned = prev_state["abandoned"] - current_abandoned

            if new_abandoned:
                self.log_change(camera_id, "objects_abandoned", ', '.join(new_abandoned))
                for obj in new_abandoned:
                    history = self.get_object_history(obj)
                    if history and history["last_person"]:
                        print(f"\n🚨 Alert: {obj} abandoned!")
                        print(f"Last seen with: {history['last_person']}")
                        print("Timeline:")
                        for event in history["timeline"]:
                            print(f"  {event}")
                        print()

            if picked_up_abandoned:
                self.log_change(camera_id, "abandoned_objects_picked", ', '.join(picked_up_abandoned))

            # Update current state
            self.current_state[camera_id] = {
                "person": current_person,
                "objects": current_person_objects,
                "abandoned": current_abandoned
            }

            # Visualize results
            frame = self.draw_detections(frame, face_locations, objects)
            for obj in objects:
                if obj['label'] in current_abandoned:
                    x1, y1, x2, y2 = obj["bbox"]
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    history = self.get_object_history(obj['label'])
                    text = f"ABANDONED (Last: {history['last_person']})" if history and history["last_person"] else "ABANDONED"
                    cv2.putText(frame, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            cv2.imshow(f"Camera {camera_id}", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyWindow(f"Camera {camera_id}")

    # -------------------------------------------------------------------------
    # Utilities
    # -------------------------------------------------------------------------
    def is_near(self, face_box, object_box, threshold=None):
        threshold = threshold or self.proximity_threshold
        ft, fr, fb, fl = face_box
        ox1, oy1, ox2, oy2 = object_box

        # Centers
        face_center = ((fl + fr) // 2, (ft + fb) // 2)
        object_center = ((ox1 + ox2) // 2, (oy1 + oy2) // 2)

        # Distance + region check
        distance = ((face_center[0] - object_center[0])**2 + (face_center[1] - object_center[1])**2) ** 0.5
        face_w, face_h = fr - fl, fb - ft
        expanded_face = (ft - face_h, fr + face_w, fb + face_h, fl - face_w)

        in_region = (expanded_face[3] <= object_center[0] <= expanded_face[1]) and \
                    (expanded_face[0] <= object_center[1] <= expanded_face[2])

        return distance < threshold or in_region

    def draw_detections(self, frame, face_locations, objects):
        for (top, right, bottom, left) in face_locations:
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        for obj in objects:
            x1, y1, x2, y2 = obj["bbox"]
            label = obj["label"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        return frame

    # -------------------------------------------------------------------------
    # Backtrack Utility
    # -------------------------------------------------------------------------
    def backtrack_object(self, object_label=None):
        """Display timeline of a tracked object (interactive if not specified)."""
        if not object_label:
            print("\nTracked objects:")
            objs = list(self.object_timeline.keys())
            for i, o in enumerate(objs, 1):
                print(f"{i}. {o}")
            try:
                choice = int(input("\nEnter object number (0 to cancel): "))
                if choice == 0:
                    return
                object_label = objs[choice - 1]
            except (ValueError, IndexError):
                print("Invalid selection.")
                return

        history = self.get_object_history(object_label)
        if not history:
            print(f"\nNo history found for {object_label}")
            return

        print(f"\n📋 History for {object_label}:")
        print(f"Current status: {history['current_status']}")
        print(f"Current camera: Camera {history['current_camera']}")
        if history['last_person']:
            print(f"Last person: {history['last_person']}")
        print("\nTimeline:")
        for event in history['timeline']:
            print(f"  {event}")
