# core/yolo_detector.py
from ultralytics import YOLO

class ObjectDetector:
    def __init__(self, model_path="yolov8n.pt"):
        self.model = YOLO(model_path)
        # Expanded list of trackable objects relevant for security and tracking
        self.target_objects = [
            # Personal bags and containers
            "backpack", "handbag", "suitcase", "bag",
            
            # Electronics
            "cell phone", "laptop", "keyboard", "mouse", "remote",
            "camera", "tv", "monitor",
            
            # Personal items
            "bottle", "cup", "umbrella", "book", "wallet",
            
            # Valuable items
            "clock", "vase", "scissors", "teddy bear",
            "bicycle", "skateboard",
            
            # Packages and boxes
            "box", "suitcase", "briefcase"
        ]

    def detect(self, frame):
        results = self.model(frame, conf=0.45)[0]  # Slightly lower confidence threshold for better detection
        objects = []

        for box in results.boxes:
            label = self.model.names[int(box.cls[0])]
            conf = float(box.conf[0])
            if label in self.target_objects:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                objects.append({
                    "label": label,
                    "conf": conf,
                    "bbox": (x1, y1, x2, y2)
                })
        return objects
