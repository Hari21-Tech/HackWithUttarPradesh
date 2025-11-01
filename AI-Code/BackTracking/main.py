# main.py
import csv
import os
import argparse
from datetime import datetime
import cv2
import shutil

from core.tracker import MultiCamTracker

def reset_data():
    """Reset all tracking data: embeddings, faces, and logs"""
    try:
        # Clear embeddings
        os.makedirs('data', exist_ok=True)
        with open('data/embeddings.json', 'w') as f:
            f.write('[]')
            
        # Clear face images
        face_dir = 'data/faces'
        if os.path.exists(face_dir):
            shutil.rmtree(face_dir)
        os.makedirs(face_dir)
            
        # Reset log file
        with open('data/track_log.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'camera', 'event_type', 'details'])
            
        print("✅ Reset complete. All tracking data has been cleared.")
        
    except Exception as e:
        print(f"❌ Error during reset: {e}")

def main():
    parser = argparse.ArgumentParser(description='Multi-Camera Object Tracking System')
    parser.add_argument('--cameras', type=int, nargs='+', default=[0],
                       help='Camera indices to use (default: [0])')
    parser.add_argument('--log', type=str, default='data/track_log.csv',
                       help='Path to log file (default: data/track_log.csv)')
    
    # Backtracking arguments
    parser.add_argument('--backtrack', action='store_true',
                       help='Enter backtrack mode instead of running tracking')
    parser.add_argument('--object', type=str,
                       help='Specific object to backtrack (optional)')
    
    # Reset argument
    parser.add_argument('--reset', action='store_true',
                       help='Reset all data: clear embeddings, face images, and logs')
    
    args = parser.parse_args()
    
    # Handle reset first
    if args.reset:
        reset_data()
        return
    
    # Initialize tracker
    tracker = MultiCamTracker(sources=args.cameras, log_file=args.log)
    
    if args.backtrack:
        # Load history from log file
        if os.path.exists(args.log):
            try:
                with open(args.log, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        timestamp = datetime.strptime(row['timestamp'], "%d-%m-%Y %H:%M:%S.%f")
                        camera = int(row['camera'])
                        
                        if row['event_type'] == 'objects_with_person':
                            person_id, objects_str = row['details'].split(': ', 1)
                            objects = objects_str.split(', ')
                            for obj in objects:
                                if obj not in tracker.object_timeline:
                                    tracker.object_timeline[obj] = []
                                tracker.object_timeline[obj].append({
                                    'timestamp': timestamp,
                                    'event': 'picked_up',
                                    'person': person_id,
                                    'camera': camera
                                })
                        elif row['event_type'] == 'objects_abandoned':
                            objects = row['details'].split(', ')
                            for obj in objects:
                                if obj not in tracker.object_timeline:
                                    tracker.object_timeline[obj] = []
                                tracker.object_timeline[obj].append({
                                    'timestamp': timestamp,
                                    'event': 'abandoned',
                                    'person': None,
                                    'camera': camera
                                })
            except Exception as e:
                print(f"Error reading log file: {e}")
                print("Make sure you have tracking data in the correct format.")
                return
        
        # Backtrack mode
        if args.object:
            tracker.backtrack_object(args.object)
        else:
            if not tracker.object_timeline:
                print("\nNo tracked objects found in the log file.")
                print("Try running the tracker first to generate some tracking data.")
                return
            tracker.backtrack_object()
    else:
        # Normal tracking mode
        try:
            tracker.start()
        except KeyboardInterrupt:
            print("\n👋 Stopping tracker...")
        finally:
            cv2.destroyAllWindows()


if __name__ == "__main__":
    main()