import cv2
from ultralytics import YOLO
import numpy as np
import queue
import threading
import time
import requests
from deep_sort_realtime.deepsort_tracker import DeepSort

# Telegram Bot Setup
TOKEN = "7594613412:AAEhZd1L2fh7te_JBbY-BzN4hJttQRTBR40"
CHAT_ID = "7755309376"

# Queue to handle messages in a separate thread
message_queue = queue.Queue()
MAX_MESSAGES = 3
COOLDOWN_PERIOD = 50  # seconds

def sendMessage(mess):
    """Send message to Telegram chat"""
    url = f"http://api.telegram.org/bot{TOKEN}/sendMessage?chat_id={CHAT_ID}&text={mess}"
    res = requests.get(url)
    if res.status_code == 200:
        print(f"Message sent: {mess}")
    else:
        print(f"Failed to send message: {mess} (Status code: {res.status_code})")
    return res

def message_sender():
    """Thread function to send messages with control for max messages"""
    message_count = 0
    last_reset_time = time.time()

    while True:
        # Check cooldown to reset count
        if time.time() - last_reset_time > COOLDOWN_PERIOD:
            message_count = 0
            last_reset_time = time.time()

        # Process messages if count allows
        if not message_queue.empty() and message_count < MAX_MESSAGES:
            mess = message_queue.get()
            print(f"Sending message: {mess}")  # Debugging message queue
            sendMessage(mess)
            message_count += 1
        else:
            time.sleep(1)  # wait if at max messages

# Start message sending thread
threading.Thread(target=message_sender, daemon=True).start()

# Load the YOLO model
model = YOLO('yolov8s-detect-upfront.pt')

# Initialize DeepSORT
tracker = DeepSort(max_age=30, n_init=3, nms_max_overlap=1.0, max_cosine_distance=0.2)

# Video input
input_video_path = 'source/fall3.mp4'  # Path to your input video

# Open the video
cap = cv2.VideoCapture(input_video_path)

# Get the video's width, height, and frames per second (FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = int(cap.get(cv2.CAP_PROP_FPS))

# Set up the named window for resizing
cv2.namedWindow('Pupil Detection', cv2.WINDOW_NORMAL)
cv2.resizeWindow('Pupil Detection', 1280, 720)

# Dictionary to store tracking information: {ID: (x, y, fall_status)}
tracked_objects = {}

def detect_falling(prev_y, current_y, threshold=20):
    """Detect if the child is falling by comparing current y position with previous y position."""
    return (current_y - prev_y) > threshold

# Process each frame
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Detect objects in the frame
    results = model(frame)
    
    # Get the bounding boxes for detected objects with conf >= 0.5
    boxes = [box for result in results for box in result.boxes if box.conf >= 0.5]
    
    # Prepare detections for DeepSORT
    detections = [(box.xyxy[0], box.conf) for box in boxes]
    
    # Update tracker
    tracks = tracker.update_tracks(detections, frame=frame)
    
    # Draw bounding boxes with IDs and fall status
    for track in tracks:
        if not track.is_confirmed():
            continue
        track_id = track.track_id
        ltrb = track.to_ltrb()
        # Convert the bounding box coordinates to integers
        bbox = list(map(int, ltrb))
        x1, y1, x2, y2 = bbox
        center_y = (y1 + y2) // 2

        # Detect fall
        fall_status = detect_falling(tracked_objects.get(track_id, (center_y,))[0], center_y)
        tracked_objects[track_id] = (center_y, (x1, y1, x2, y2), fall_status)

        # Send message if falling is detected
        if fall_status and not tracked_objects[track_id][2]:  # Check if it's a new fall event
            print(f"Fall detected for child ID {track_id}")  # Debugging fall detection
            message_queue.put(f"Alert: Child ID {track_id} is falling!")

        # Set color based on fall status
        color = (0, 0, 255) if fall_status else (0, 255, 0)  # Red if falling, green otherwise

        # Draw the bounding box on the frame
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        # Put the text on the frame
        cv2.putText(frame, f'ID: {track_id} {"FALLING" if fall_status else ""}', 
                    (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Display the frame (resized to 1280x720)
    cv2.imshow('Pupil Detection', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
