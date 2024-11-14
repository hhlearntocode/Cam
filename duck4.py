import cv2
from ultralytics import YOLO
import numpy as np
import queue
import threading
import time
import requests
import argparse
from deep_sort_realtime.deepsort_tracker import DeepSort

# Telegram Bot Setup
TOKEN = "7594613412:AAEhZd1L2fh7te_JBbY-BzN4hJttQRTBR40"
CHAT_ID = "7755309376"

# Queue to handle messages in a separate thread
message_queue = queue.Queue()

def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="YOLO-based fall detection with Telegram alerts.")
    parser.add_argument('--video', type=str, default='source/fall3.mp4', help="Path to the input video or '0' for webcam.")
    parser.add_argument('--model', type=str, default='best(1).pt', help="Path to the YOLO model file.")
    parser.add_argument('--cooldown', type=int, default=50, help="Cooldown period in seconds between message batches.")
    parser.add_argument('--max_messages', type=int, default=3, help="Maximum messages allowed per cooldown period.")
    parser.add_argument('--token', type=str, default=TOKEN, help="Telegram bot token.")
    parser.add_argument('--chat_id', type=str, default=CHAT_ID, help="Telegram chat ID for alerts.")
    return parser.parse_args()

def sendMessage(token, chat_id, mess):
    """Send message to Telegram chat."""
    url = f"http://api.telegram.org/bot{token}/sendMessage?chat_id={chat_id}&text={mess}"
    res = requests.get(url)
    return res

def message_sender(token, chat_id, cooldown, max_messages):
    """Thread function to send messages with control for max messages and cooldown."""
    message_count = 0
    last_reset_time = time.time()

    while True:
        if time.time() - last_reset_time > cooldown:
            message_count = 0
            last_reset_time = time.time()

        if not message_queue.empty() and message_count < max_messages:
            mess = message_queue.get()
            sendMessage(token, chat_id, mess)
            message_count += 1
        else:
            time.sleep(1)

def detect_falling(prev_y, current_y, threshold=20):
    """Detect if the child is falling by comparing current y position with previous y position."""
    return (current_y - prev_y) > threshold

def process_frame(frame, model, tracker, tracked_objects):
    """Run YOLO detection and DeepSORT tracking, and handle fall detection."""
    results = model(frame)
    boxes = [box for result in results for box in result.boxes if box.conf >= 0.5]
    
    # Prepare detections for DeepSORT: each detection is a bounding box + confidence
    detections = []
    for box in boxes:
        x_min, y_min, x_max, y_max = map(int, box.xyxy[0])
        width = x_max - x_min
        height = y_max - y_min
        detections.append(([x_min, y_min, width, height], float(box.conf)))
    
    tracks = tracker.update_tracks(detections, frame=frame)
    
    for track in tracks:
        if not track.is_confirmed():
            continue
        track_id = track.track_id
        ltrb = track.to_ltrb()  # Get left, top, right, bottom coordinates
        bbox = [int(ltrb[0]), int(ltrb[1]), int(ltrb[2]), int(ltrb[3])]  # [x1, y1, x2, y2]
        x1, y1, x2, y2 = bbox
        center_y = (y1 + y2) // 2

        # Fall detection logic
        prev_y, _, prev_fall_status = tracked_objects.get(track_id, (center_y, (x1, y1, x2, y2), False))
        fall_status = detect_falling(prev_y, center_y)
        tracked_objects[track_id] = (center_y, (x1, y1, x2, y2), fall_status)

        # Alert if fall is detected and it's a new fall
        if fall_status and not prev_fall_status:
            print(f"Fall detected for child ID {track_id}")
            message_queue.put(f"Alert: Child ID {track_id} is falling!")

        # Draw bounding box with status
        color = (0, 0, 255) if fall_status else (0, 255, 0)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, f'ID: {track_id} {"FALLING" if fall_status else ""}', 
                    (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    return frame

def main():
    args = parse_args()

    # Start message sending thread
    threading.Thread(target=message_sender, args=(args.token, args.chat_id, args.cooldown, args.max_messages), daemon=True).start()

    # Initialize YOLO model and DeepSORT tracker
    model = YOLO(args.model)
    tracker = DeepSort(max_age=30, n_init=3, nms_max_overlap=1.0, max_cosine_distance=0.2)

    # Setup video capture
    source = int(args.video) if args.video.isdigit() else args.video
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print("Error: Could not open video source")
        return

    cv2.namedWindow('Fall Detection', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('Fall Detection', 1280, 720)
    tracked_objects = {}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Process frame for detection and tracking
        frame = process_frame(frame, model, tracker, tracked_objects)
        
        # Show the frame
        cv2.imshow('Fall Detection', frame)
        
        # Exit on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
