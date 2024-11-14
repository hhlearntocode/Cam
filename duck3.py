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
    """Send message to Telegram chat with error handling."""
    url = f"http://api.telegram.org/bot{TOKEN}/sendMessage?chat_id={CHAT_ID}&text={mess}"
    try:
        res = requests.get(url)
        res.raise_for_status()  # Raise error if response is not successful
    except requests.exceptions.RequestException as e:
        print(f"Error sending message: {e}")
    return res 

def message_sender(): 
    """Thread function to send messages with control for max messages""" 
    message_count = 0 
    last_reset_time = time.time() 

    while True: 
        if time.time() - last_reset_time > COOLDOWN_PERIOD: 
            message_count = 0 
            last_reset_time = time.time() 

        if not message_queue.empty() and message_count < MAX_MESSAGES: 
            mess = message_queue.get() 
            sendMessage(mess) 
            message_count += 1 
        else: 
            time.sleep(1) 

# Start message sending thread 
threading.Thread(target=message_sender, daemon=True).start() 

# Load the YOLO model 
model = YOLO('best(1).pt') 

# Initialize DeepSORT 
tracker = DeepSort(max_age=30, n_init=3, nms_max_overlap=1.0, max_cosine_distance=0.2) 

# Video input 
input_video_path = 'source/video2.mp4' 
cap = cv2.VideoCapture(input_video_path) 

# Video frame settings 
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) 
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) 
fps = int(cap.get(cv2.CAP_PROP_FPS)) 

cv2.namedWindow('Pupil Detection', cv2.WINDOW_NORMAL) 
cv2.resizeWindow('Pupil Detection', 1280, 720) 

tracked_objects = {} 

def detect_falling(prev_y, current_y, threshold=20): 
    """Detect if the child is falling by comparing current y position with previous y position.""" 
    return (current_y - prev_y) > threshold 

while cap.isOpened(): 
    ret, frame = cap.read() 
    if not ret: 
        break 

    # Run YOLO detection 
    results = model(frame) 
    boxes = [box for result in results for box in result.boxes if box.conf >= 0.5] 

    # Format detections for DeepSORT: each detection is a bounding box + confidence 
    detections = []
    for box in boxes:
        x_min, y_min, x_max, y_max = map(int, box.xyxy[0])
        width = x_max - x_min
        height = y_max - y_min
        detections.append(([x_min, y_min, width, height], float(box.conf)))

    # Update tracker 
    tracks = tracker.update_tracks(detections, frame=frame) 

    for track in tracks: 
        if not track.is_confirmed(): 
            continue
        track_id = track.track_id
        ltrb = track.to_ltrb()  # Get left, top, right, bottom coordinates from tracker
        bbox = list(map(int, ltrb))  # Convert to integers if necessary
        x1, y1, x2, y2 = bbox
        center_y = (y1 + y2) // 2

        # Fall detection check 
        prev_y, _, prev_fall_status = tracked_objects.get(track_id, (center_y, (x1, y1, x2, y2), False)) 
        fall_status = detect_falling(prev_y, center_y) 
        tracked_objects[track_id] = (center_y, (x1, y1, x2, y2), fall_status) 

        # Send alert if a fall is detected and it's the first detection of the fall 
        if fall_status and not prev_fall_status: 
            print(f"Fall detected for child ID {track_id}") 
            message_queue.put(f"Alert: Child ID {track_id} is falling!") 

        # Drawing bounding box 
        color = (0, 0, 255) if fall_status else (0, 255, 0) 
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2) 
        cv2.putText(frame, f'ID: {track_id} {"FALLING" if fall_status else ""}',  
                    (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2) 

    # Show frame 
    cv2.imshow('Pupil Detection', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'): 
            break 

cap.release() 
cv2.destroyAllWindows()