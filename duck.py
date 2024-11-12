from ultralytics import YOLO
import cv2
import numpy as np
import argparse
import os
import json
from datetime import datetime
import requests
import threading
import queue
import time

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

def save_pose_data(pose_data, filepath):
    """Save pose data to a JSON file"""
    with open(filepath, 'w') as f:
        json.dump(pose_data, f, indent=4)

def convert_keypoints_to_dict(keypoints_np):
    """Convert numpy keypoints to a serializable dictionary"""
    keypoints_dict = []
    for i, (x, y, conf) in enumerate(keypoints_np):
        keypoints_dict.append({
            'keypoint_id': i,
            'x': float(x),
            'y': float(y),
            'confidence': float(conf)
        })
    return keypoints_dict

def calculate_angle(pointA, pointB, pointC):
    """Calculate the angle at pointB formed by the line segments BA and BC."""
    pointA = np.array(pointA)
    pointB = np.array(pointB)
    pointC = np.array(pointC)

    BA = pointA - pointB
    BC = pointC - pointB

    dot_product = np.dot(BA, BC)
    mag_BA = np.linalg.norm(BA)
    mag_BC = np.linalg.norm(BC)

    if mag_BA == 0 or mag_BC == 0:
        return 0.0
    
    cosine_angle = dot_product / (mag_BA * mag_BC)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def detect_fall(keypoints_np):
    """
    Detect a fall based on keypoint angles.
    """
    if len(keypoints_np) < 17:
        return False

    shoulder_left = keypoints_np[5][:2]
    shoulder_right = keypoints_np[6][:2]
    hip_left = keypoints_np[11][:2]
    hip_right = keypoints_np[12][:2]
    
    torso_angle = calculate_angle(shoulder_left, hip_left, hip_right)
    
    if 80 <= torso_angle <= 100:
        return True
    return False

def draw_pose_info(frame, results):
    if not results or len(results) == 0:
        return frame, {}
    
    h, w = frame.shape[:2]
    pose_data = {
        'timestamp': datetime.now().isoformat(),
        'frame_dimensions': {'width': w, 'height': h},
        'people': []
    }
    
    num_people = len(results[0].keypoints.data)
    cv2.putText(frame, f"People detected: {num_people}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    for person_id, keypoints in enumerate(results[0].keypoints.data):
        keypoints_np = keypoints.cpu().numpy()

        if keypoints_np.size == 0:
            continue
        
        avg_conf = float(np.mean(keypoints_np[:, 2][keypoints_np[:, 2] > 0]))

        if avg_conf > 0.92:
            message_queue.put(f"Person {person_id} detected with high confidence: {avg_conf:.2f}")
        
        person_data = {
            'person_id': person_id,
            'average_confidence': avg_conf,
            'keypoints': convert_keypoints_to_dict(keypoints_np)
        }
        pose_data['people'].append(person_data)
        
        nose_x, nose_y = int(keypoints_np[0][0]), int(keypoints_np[0][1])
        id_text = f"ID {person_id}: {avg_conf:.2f}"
        cv2.putText(frame, id_text, (nose_x, nose_y - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        for i, (x, y, conf) in enumerate(keypoints_np):
            if conf > 0.5:
                x, y = int(x), int(y)
                cv2.circle(frame, (x, y), 4, (0, 255, 0), -1)
                point_text = f"{i}: {conf:.2f}"
                cv2.putText(frame, point_text, (x + 5, y + 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
        
        skeleton = [[5, 7], [7, 9], [6, 8], [8, 10], [11, 13], [13, 15],
                    [12, 14], [14, 16], [5, 6], [5, 11], [6, 12], [11, 12]]
        
        for start_point, end_point in skeleton:
            if keypoints_np[start_point][2] > 0.5 and keypoints_np[end_point][2] > 0.5:
                start_pos = (int(keypoints_np[start_point][0]), int(keypoints_np[start_point][1]))
                end_pos = (int(keypoints_np[end_point][0]), int(keypoints_np[end_point][1]))
                cv2.line(frame, start_pos, end_pos, (0, 255, 255), 2)
        
        # Check for fall and send message
        if detect_fall(keypoints_np):
            message_queue.put(f"Fall detected for person {person_id}")
    
    return frame, pose_data

def main():
    parser = argparse.ArgumentParser(description='YOLO Pose Detection Visualization')
    parser.add_argument('--source', type=str, default='source/video2.mp4',
                      help='Source for video capture (0 for webcam or video path)')
    parser.add_argument('--model', type=str, default='yolov8n-pose.pt',
                      help='Path to YOLO pose model')
    parser.add_argument('--save-interval', type=int, default=30,
                      help='Save pose data every N frames')
    args = parser.parse_args()

    data_dir = 'data'
    os.makedirs(data_dir, exist_ok=True)

    model = YOLO(args.model)
    source = int(args.source) if args.source.isdigit() else args.source
    cap = cv2.VideoCapture(source)
    
    if not cap.isOpened():
        print("Error: Could not open video source")
        return

    print(f"Started pose detection on {'webcam' if isinstance(source, int) else source}")
    print(f"Saving pose data every {args.save_interval} frames to {data_dir}/")
    print("Press 'q' to quit")
    
    frame_count = 0
    batch_pose_data = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break
            
        results = model(frame, verbose=False)
        frame, pose_data = draw_pose_info(frame, results)
        
        if pose_data:
            pose_data['frame_number'] = frame_count
            batch_pose_data.append(pose_data)
        
        if frame_count % args.save_interval == 0 and batch_pose_data:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(data_dir, f'pose_data_{timestamp}_frame_{frame_count}.json')
            save_pose_data(batch_pose_data, filename)
            print(f"Saved pose data to {filename}")
            batch_pose_data = []

        frame = cv2.resize(frame, (1280, 720))
        cv2.imshow('YOLO Pose Detection', frame)
        
        frame_count += 1
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            if batch_pose_data:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = os.path.join(data_dir, f'pose_data_{timestamp}_final.json')
                save_pose_data(batch_pose_data, filename)
                print(f"Saved final pose data to {filename}")
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print("Pose detection ended.")

if __name__ == '__main__':
    main()
