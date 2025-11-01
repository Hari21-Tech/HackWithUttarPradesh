# core/utils.py
import os
import cv2
import pandas as pd
from datetime import datetime
import matplotlib.pyplot as plt
import glob
import seaborn as sns
import csv


def create_directories(dirs):
    """Create directories if they don't exist"""
    for d in dirs:
        os.makedirs(d, exist_ok=True)


def load_camera_feeds(sources):
    """Load camera feeds from various sources"""
    cameras = []
    for src in sources:
        cap = cv2.VideoCapture(src)
        if not cap.isOpened():
            print(f"Warning: Could not open camera source {src}")
        cameras.append(cap)
    return cameras


def get_last_seen(log_file, person_id=None, object_type=None):
    """
    Find the last occurrence of a person or object in the logs

    Args:
        log_file: Path to the tracking log CSV
        person_id: Optional person ID to filter by
        object_type: Optional object type to filter by

    Returns:
        DataFrame row with the most recent matching entry
    """
    if not os.path.exists(log_file):
        return None

    df = pd.read_csv(log_file)

    # Convert timestamp strings to datetime objects
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Apply filters
    if person_id:
        df = df[df['person_id'] == person_id]

    if object_type:
        # Filter where the object_type is in the objects column
        df = df[df['objects'].str.contains(object_type, na=False)]

    if df.empty:
        return None

    # Sort by timestamp and get the most recent entry
    df = df.sort_values('timestamp', ascending=False)
    return df.iloc[0]


def backtrack_object(log_file, object_type):
    """
    Backtrack an object's movement history across cameras and its associations with people

    Args:
        log_file: Path to the tracking log CSV
        object_type: Object type to search for (e.g., "backpack", "cell phone")

    Returns:
        Dictionary with detailed tracking information
    """
    if not os.path.exists(log_file):
        return {
            "found": False,
            "message": "Log file not found"
        }

    history = []
    with open(log_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if object_type in row['objects']:
                history.append({
                    'timestamp': row['timestamp'],
                    'camera': row['camera'],
                    'person_id': row['person_id'],
                    'status': row['status']
                })

    if not history:
        return {
            "found": False,
            "message": f"No records found for {object_type}"
        }

    # Sort history by timestamp
    history.sort(key=lambda x: datetime.strptime(x['timestamp'], "%d-%m-%Y %H:%M:%S.%f"))
    
    first_seen = history[0]
    last_seen = history[-1]
    
    # Analyze movement patterns
    camera_transitions = []
    prev_camera = None
    for entry in history:
        if prev_camera is not None and entry['camera'] != prev_camera:
            camera_transitions.append({
                'timestamp': entry['timestamp'],
                'from_camera': prev_camera,
                'to_camera': entry['camera']
            })
        prev_camera = entry['camera']

    # Analyze person associations
    person_history = []
    prev_person = None
    for entry in history:
        if prev_person != entry['person_id']:
            person_history.append({
                'timestamp': entry['timestamp'],
                'person_id': entry['person_id'],
                'camera': entry['camera'],
                'status': entry['status']
            })
        prev_person = entry['person_id']

    return {
        "found": True,
        "first_seen": first_seen,
        "last_seen": last_seen,
        "total_sightings": len(history),
        "unique_cameras": len(set(entry['camera'] for entry in history)),
        "camera_transitions": camera_transitions,
        "person_associations": person_history,
        "timeline": history,
        "current_status": last_seen['status']
    }


def view_person_faces(faces_dir, person_id=None):
    """
    View faces stored for a specific person or all people

    Args:
        faces_dir: Directory containing face images
        person_id: Optional person ID to filter by
    """
    if not os.path.exists(faces_dir):
        print(f"Faces directory not found: {faces_dir}")
        return

    # Get all person directories
    if person_id:
        person_dirs = [os.path.join(faces_dir, person_id)]
        if not os.path.exists(person_dirs[0]):
            print(f"No images found for {person_id}")
            return
    else:
        person_dirs = [os.path.join(faces_dir, d) for d in os.listdir(faces_dir)
                       if os.path.isdir(os.path.join(faces_dir, d))]

    # Display images for each person
    for person_dir in person_dirs:
        person_id = os.path.basename(person_dir)
        image_paths = glob.glob(os.path.join(person_dir, "*.jpg"))

        if not image_paths:
            print(f"No images found for {person_id}")
            continue

        # Sort by filename (which contains timestamp)
        image_paths.sort()

        # Display the most recent image
        latest_image = image_paths[-1]
        image = cv2.imread(latest_image)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Show image
        plt.figure(figsize=(5, 5))
        plt.imshow(image)
        plt.title(f"{person_id} - {os.path.basename(latest_image)}")
        plt.axis('off')
        plt.show()

        print(f"{person_id}: {len(image_paths)} images stored")


def analyze_logs(log_file):
    """
    Generate a summary analysis of the tracking logs

    Args:
        log_file: Path to the tracking log CSV

    Returns:
        DataFrame with summary statistics
    """
    if not os.path.exists(log_file):
        print(f"Log file not found: {log_file}")
        return None

    df = pd.read_csv(log_file)

    if df.empty:
        print("Log file is empty")
        return None

    # Convert timestamp strings to datetime objects
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['date'] = df['timestamp'].dt.date

    # Extract all unique objects
    all_objects = set()
    for obj_list in df['objects']:
        if isinstance(obj_list, str) and obj_list != "None":
            objects = [o.strip() for o in obj_list.split(',')]
            all_objects.update(objects)

    # Create summary DataFrame
    summary = {
        'total_records': len(df),
        'unique_persons': df['person_id'].nunique(),
        'unique_cameras': df['camera'].nunique(),
        'date_range': f"{df['date'].min()} to {df['date'].max()}",
        'unique_objects': len(all_objects),
        'object_types': ', '.join(sorted(all_objects))
    }

    return pd.DataFrame([summary])


def generate_object_frequency_chart(log_file):
    """
    Generate a bar chart showing object frequency

    Args:
        log_file: Path to the tracking log CSV
    """
    if not os.path.exists(log_file):
        print(f"Log file not found: {log_file}")
        return

    df = pd.read_csv(log_file)

    if df.empty:
        print("Log file is empty")
        return

    # Extract and count objects
    object_counts = {}

    for obj_list in df['objects']:
        if isinstance(obj_list, str) and obj_list != "None":
            objects = [o.strip() for o in obj_list.split(',')]
            for obj in objects:
                if obj in object_counts:
                    object_counts[obj] += 1
                else:
                    object_counts[obj] = 1

    # Create chart
    plt.figure(figsize=(12, 6))
    sns.barplot(x=list(object_counts.keys()), y=list(object_counts.values()))
    plt.title("Object Detection Frequency")
    plt.xlabel("Object Type")
    plt.ylabel("Count")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()


def generate_person_timeline(log_file, person_id=None):
    """
    Generate a timeline of person detections

    Args:
        log_file: Path to the tracking log CSV
        person_id: Optional person ID to filter by
    """
    if not os.path.exists(log_file):
        print(f"Log file not found: {log_file}")
        return

    df = pd.read_csv(log_file)

    if df.empty:
        print("Log file is empty")
        return

    # Convert timestamp strings to datetime objects
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Filter by person if specified
    if person_id:
        df = df[df['person_id'] == person_id]
        if df.empty:
            print(f"No records found for {person_id}")
            return

    # Create timeline
    plt.figure(figsize=(15, 8))

    # Group by person and plot
    for pid, group in df.groupby('person_id'):
        plt.plot(group['timestamp'], [pid] * len(group), 'o-', label=pid)

    plt.yticks(df['person_id'].unique())
    plt.xlabel('Time')
    plt.ylabel('Person ID')
    plt.title('Person Detection Timeline')
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()


def check_log_integrity(log_file):
    """
    Check log file for potential issues

    Args:
        log_file: Path to the tracking log CSV

    Returns:
        Dictionary with integrity check results
    """
    if not os.path.exists(log_file):
        return {"error": f"Log file not found: {log_file}"}

    df = pd.read_csv(log_file)

    if df.empty:
        return {"error": "Log file is empty"}

    # Convert timestamp strings to datetime objects
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Find duplicate entries (same person, camera, and timestamp)
    duplicates = df[df.duplicated(subset=['timestamp', 'person_id', 'camera'], keep=False)]

    # Find potential gaps in logging (time difference > 10 minutes)
    df_sorted = df.sort_values('timestamp')
    df_sorted['time_diff'] = df_sorted['timestamp'].diff().dt.total_seconds()
    time_gaps = df_sorted[df_sorted['time_diff'] > 600]  # 10 minutes

    return {
        "total_records": len(df),
        "date_range": f"{df['timestamp'].min()} to {df['timestamp'].max()}",
        "duplicate_entries": len(duplicates),
        "time_gaps_count": len(time_gaps),
        "duplicates": duplicates if not duplicates.empty else None,
        "time_gaps": time_gaps[['timestamp', 'person_id', 'camera', 'time_diff']] if not time_gaps.empty else None
    }

def summarize_logs_by_person(log_file):
    if not os.path.exists(log_file):
        print(f"Log file not found: {log_file}")
        return

    df = pd.read_csv(log_file)

    if df.empty:
        print("Log file is empty")
        return

    summary = {}

    for _, row in df.iterrows():
        pid = row['person_id']
        camera = str(row['camera'])
        objects = row['objects']

        if pid not in summary:
            summary[pid] = {
                'cameras': set(),
                'objects': set()
            }

        summary[pid]['cameras'].add(camera)

        if isinstance(objects, str) and objects.lower() != 'none':
            for obj in objects.split(','):
                summary[pid]['objects'].add(obj.strip())

    # Display summary
    for pid, data in summary.items():
        print(f"\n👤 {pid}")
        print(f"   • Cameras: {', '.join(sorted(data['cameras']))}")
        if data['objects']:
            print(f"   • Objects: {', '.join(sorted(data['objects']))}")
        else:
            print("   • Objects: None")
