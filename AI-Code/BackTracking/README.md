# Multi-Camera Object and Person Tracking System 🎥

A real-time surveillance system that tracks people and objects across multiple cameras, with special focus on abandoned object detection and person-object association tracking.

## 🌟 Key Features

- **Multi-Camera Support**: Monitor multiple camera feeds simultaneously
- **Face Recognition**: Identify and track people across different cameras
- **Object Detection**: Detect and track various objects (bags, phones, laptops, etc.)
- **Abandoned Object Detection**: Alert when objects are left behind
- **Person-Object Association**: Track which objects belong to which person
- **Object History**: Backtrack any object's complete history
- **Real-time Visualization**: Visual feedback with bounding boxes and status indicators

## 🏗️ Project Structure

```
multi_cam_tracker/
├── core/
│   ├── facial.py         # Face recognition implementation
│   ├── tracker.py        # Main tracking system
│   └── yolo_detector.py  # Object detection using YOLO
├── data/                 # Created automatically
│   ├── faces/           # Stores face images
│   ├── embeddings.json  # Face embeddings database
│   └── track_log.csv    # Event tracking log
├── main.py              # Command-line interface
├── requirements.txt     # Project dependencies
└── README.md           # Project documentation
```

## 💻 Technical Implementation

### Core Components

1. **FacialRecognition Class** (`core/facial.py`)
   - Handles face detection and recognition
   - Uses face_recognition library
   - Maintains face embeddings database
   - Methods:
     - `recognize_or_register`: Identifies known faces or registers new ones
     - `save_face_image`: Stores face images for each person

2. **MultiCamTracker Class** (`core/tracker.py`)
   - Main tracking system
   - Coordinates between cameras, faces, and objects
   - Key attributes:
     - `current_state`: Tracks current camera states
     - `object_timeline`: Complete history of all objects
   - Methods:
     - `process_camera`: Handles individual camera feeds
     - `is_near`: Determines person-object associations
     - `backtrack_object`: Retrieves object history

3. **ObjectDetector Class** (`core/yolo_detector.py`)
   - YOLO-based object detection (auto-downloads model when needed)
   - Detects 26 types of objects across 5 categories:
     - Personal bags and containers (4 types)
     - Electronics (8 types)
     - Personal items (5 types)
     - Valuable items (6 types)
     - Packages and boxes (3 types)

### Models Used

1. **Face Recognition**:
   - Library: `face_recognition`
   - Model: dlib's face recognition model
   - Features: 128-dimensional face embeddings

2. **Object Detection**:
   - Model: YOLO (You Only Look Once)
   - Pretrained on COCO dataset
   - Detects 80+ object categories

## 📝 Event Logging

The system maintains a CSV log (`data/track_log.csv`) with the following format:
```csv
timestamp,camera,event_type,details
```

### Event Types:
1. `person_detected`: New person identified
2. `person_left`: Person leaves camera view
3. `objects_with_person`: Objects associated with person
4. `objects_removed`: Objects no longer with person
5. `objects_abandoned`: Objects left behind
6. `abandoned_objects_picked`: Abandoned objects retrieved

## 🚀 Usage Guide

### Installation
```bash

# Install requirements
pip install -r requirements.txt
```

### Basic Usage

1. **Start Tracking**:
   ```bash
   # Use default camera
   python main.py

   # Use multiple cameras
   python main.py --cameras 0 1 2
   ```

2. **Reset All Data**:
   ```bash
   python main.py --reset
   ```

3. **Backtrack Objects**:
   ```bash
   # Show all objects and their history
   python main.py --backtrack

   # Track specific object
   python main.py --backtrack --object "cell phone"
   ```

### Visual Indicators

- 🟢 Green Box: Detected Person
- 🔵 Blue Box: Object with Person
- 🔴 Red Box: Abandoned Object
- Text Labels: Show person IDs and object status

## 🔍 Object Tracking Features

1. **Person-Object Association**:
   - Tracks which objects belong to which person
   - Uses proximity and region-based association
   - Maintains association history

2. **Abandoned Object Detection**:
   - Detects when objects are left behind
   - Shows last known person who had the object
   - Maintains complete object timeline

3. **History Tracking**:
   - Complete timeline of each object
   - Records all interactions and status changes
   - Shows camera transitions

## 🛠️ Configuration

Key parameters that can be adjusted in the code:

1. **Tracking Parameters**:
   - `proximity_threshold`: Distance for person-object association (default: 200 pixels)
   - `abandon_timeout`: Time before marking object as abandoned (default: 30 seconds)

2. **Face Recognition**:
   - `threshold`: Face matching threshold (default: 0.7)
   - Face image storage in `data/faces/`

## 🎯 Use Cases

1. **Security Monitoring**:
   - Track abandoned objects in public spaces
   - Monitor person-object interactions
   - Track suspicious behavior

2. **Retail Analytics**:
   - Track customer-product interactions
   - Monitor product placement
   - Analyze customer behavior

3. **Asset Tracking**:
   - Track equipment movement
   - Monitor asset usage
   - Track asset ownership

