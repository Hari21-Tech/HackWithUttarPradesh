# test_tracker.py
import cv2
import time
import sys


def test_camera(camera_id=0):
    """
    Simple test to verify camera functionality
    """
    print(f"Testing camera {camera_id}...")
    cap = cv2.VideoCapture(camera_id)

    if not cap.isOpened():
        print(f"Error: Could not open camera {camera_id}")
        return False

    print(f"Camera {camera_id} opened successfully")
    print(f"Width: {cap.get(cv2.CAP_PROP_FRAME_WIDTH)}")
    print(f"Height: {cap.get(cv2.CAP_PROP_FRAME_HEIGHT)}")
    print(f"FPS: {cap.get(cv2.CAP_PROP_FPS)}")

    # Read and display 10 frames
    for i in range(10):
        ret, frame = cap.read()

        if not ret:
            print(f"Error reading frame {i}")
            cap.release()
            return False

        print(f"Frame {i} read successfully, shape: {frame.shape}")

        # Display frame
        cv2.imshow(f"Test Camera {camera_id}", frame)
        cv2.waitKey(100)  # Display for 100ms

    cap.release()
    cv2.destroyAllWindows()
    print(f"Camera {camera_id} test completed successfully")
    return True


def test_object_detector():
    """
    Simple test for the object detector
    """
    try:
        from core.yolo_detector import ObjectDetector

        print("Testing object detector...")
        detector = ObjectDetector()

        # Test with a sample image or camera frame
        cap = cv2.VideoCapture(0)
        ret, frame = cap.read()
        cap.release()

        if not ret:
            print("Error: Could not capture frame for object detection test")
            return False

        objects = detector.detect(frame)
        print(f"Detected {len(objects)} objects:")
        for obj in objects:
            print(f"  - {obj['label']} (confidence: {obj['conf']:.2f})")

        return True
    except Exception as e:
        print(f"Error testing object detector: {e}")
        return False


def test_face_recognition():
    """
    Simple test for face recognition
    """
    try:
        import face_recognition
        from core.facial import FacialRecognition

        print("Testing face recognition...")

        # Initialize face recognition
        facial = FacialRecognition()

        # Test with a sample image or camera frame
        cap = cv2.VideoCapture(0)
        ret, frame = cap.read()
        cap.release()

        if not ret:
            print("Error: Could not capture frame for face recognition test")
            return False

        # Detect faces
        face_locations = face_recognition.face_locations(frame)
        print(f"Detected {len(face_locations)} faces")

        for face_location in face_locations:
            encodings = face_recognition.face_encodings(frame, [face_location])
            if encodings:
                person_id = facial.recognize_or_register(encodings[0])
                print(f"Recognized person: {person_id}")

        return True
    except Exception as e:
        print(f"Error testing face recognition: {e}")
        return False


if __name__ == "__main__":
    print("Running diagnostic tests...")

    # Test camera(s)
    if len(sys.argv) > 1:
        # Test specific camera ID
        camera_id = int(sys.argv[1])
        test_camera(camera_id)
    else:
        # Test default camera
        test_camera(0)

    # Test object detector
    test_object_detector()

    # Test face recognition
    test_face_recognition()

    print("Tests completed.")