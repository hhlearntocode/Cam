import cv2
from ultralytics import YOLO
import numpy as np
import queue
import threading
import time
import requests
import math

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
            sendMessage(mess)
            message_count += 1
        else:
            time.sleep(1)  # wait if at max messages

# Start message sending thread
threading.Thread(target=message_sender, daemon=True).start()

# Load the YOLO model
model = YOLO('best(1).pt')

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
next_id = 0  # To keep track of the next unique ID

def calculate_iou(box1, box2):
    """Calculate Intersection over Union (IoU) of two boxes"""
    x1, y1, x2, y2 = box1
    x1_p, y1_p, x2_p, y2_p = box2

    inter_x1 = max(x1, x1_p)
    inter_y1 = max(y1, y1_p)
    inter_x2 = min(x2, x2_p)
    inter_y2 = min(y2, y2_p)

    inter_area = max(0, inter_x2 - inter_x1 + 1) * max(0, inter_y2 - inter_y1 + 1)
    box1_area = (x2 - x1 + 1) * (y2 - y1 + 1)
    box2_area = (x2_p - x1_p + 1) * (y2_p - y1_p + 1)

    iou = inter_area / float(box1_area + box2_area - inter_area)
    return iou

def assign_id_and_detect_fall(boxes):
    global next_id, tracked_objects
    new_tracked_objects = {}

    for box in boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        center_y = (y1 + y2) // 2

        best_match_id = None
        best_iou = 0.3  # IoU threshold for matching

        # Match detected box with existing tracked objects based on IoU
        for obj_id, (_, prev_box, fall_status) in tracked_objects.items():
            iou = calculate_iou((x1, y1, x2, y2), prev_box)
            if iou > best_iou:
                best_iou = iou
                best_match_id = obj_id

        # If a matching ID is found, update its position
        if best_match_id is not None:
            prev_center_y = tracked_objects[best_match_id][0]
            new_fall_status = detect_falling(prev_center_y, center_y)
            new_tracked_objects[best_match_id] = (center_y, (x1, y1, x2, y2), new_fall_status)

            # Send message if falling is detected
            if new_fall_status and not fall_status:  # Check if it's a new fall event
                message_queue.put(f"Alert: Child ID {best_match_id} is falling!")

        else:
            # Create a new ID if no match found
            new_tracked_objects[next_id] = (center_y, (x1, y1, x2, y2), False)
            next_id += 1

    tracked_objects = new_tracked_objects  # Update with new tracking data

def detect_falling(prev_y, current_y, threshold=20):
    """Detect if the child is falling by comparing current y position with previous y position."""
    return (current_y - prev_y) > threshold

# Process each frame
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Detect pupils in the frame
    results = model(frame)
    
    # Get the bounding boxes for detected pupils with conf >= 0.5
    boxes = [box for result in results for box in result.boxes if box.conf >= 0.5]
    
    # Assign IDs and detect falls
    assign_id_and_detect_fall(boxes)

    # Draw bounding boxes with IDs and fall status
    for obj_id, (center_y, (x1, y1, x2, y2), fall_status) in tracked_objects.items():
        color = (0, 0, 255) if fall_status else (0, 255, 0)  # Red if falling, green otherwise
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, f'ID: {obj_id} {"FALLING" if fall_status else ""}', 
                    (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Display the frame (resized to 1280x720)
    cv2.imshow('Pupil Detection', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
