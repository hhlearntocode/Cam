from ultralytics import YOLO
import cv2
import json
import numpy as np

# YOLOv8 keypoints to MediaPipe mapping
YOLO_TO_MEDIAPIPE = {
    0: 0,    # nose
    1: 7,    # left_eye
    2: 8,    # right_eye
    3: 3,    # left_ear
    4: 6,    # right_ear
    5: 11,   # left_shoulder
    6: 12,   # right_shoulder
    7: 13,   # left_elbow
    8: 14,   # right_elbow
    9: 15,   # left_wrist
    10: 16,  # right_wrist
    11: 23,  # left_hip
    12: 24,  # right_hip
    13: 25,  # left_knee
    14: 26,  # right_knee
    15: 27,  # left_ankle
    16: 28,  # right_ankle
}

def convert_to_mediapipe_format(keypoints):
    """Convert YOLOv8 keypoints to MediaPipe format"""
    # Initialize MediaPipe format with 33 keypoints
    mediapipe_keypoints = []
    
    # Each keypoint will have x, y, z, visibility
    for i in range(33):
        mediapipe_keypoints.append({
            'x': 0,
            'y': 0,
            'z': 0,
            'visibility': 0
        })
    
    # Map YOLO keypoints to MediaPipe format
    for yolo_idx, mp_idx in YOLO_TO_MEDIAPIPE.items():
        if yolo_idx < len(keypoints):
            x, y, conf = keypoints[yolo_idx]
            mediapipe_keypoints[mp_idx] = {
                'x': float(x),
                'y': float(y),
                'z': 0.0,  # YOLO doesn't provide z-coordinate
                'visibility': float(conf)
            }
    
    return mediapipe_keypoints


model = YOLO('yolov8n-pose.pt') 

cap = cv2.VideoCapture(0)

frame_count = 0
pose_data = {}

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Failed to grab frame")
        break
        
    # Run pose estimation
    results = model(frame)
    
    # Create a copy of the frame to draw on
    display_frame = frame.copy()
    
    # Get the keypoints
    if len(results) > 0:
        # Store pose data for each person detected
        for person_id, person_keypoints in enumerate(results[0].keypoints.data):
            # Convert tensor to numpy array and normalize coordinates
            h, w = frame.shape[:2]
            keypoints = person_keypoints.cpu().numpy()
            normalized_keypoints = [(x/w, y/h, conf) for x, y, conf in keypoints]
            
            # Convert to MediaPipe format
            mediapipe_data = convert_to_mediapipe_format(normalized_keypoints)
            
            # Store in pose_data
            if frame_count not in pose_data:
                pose_data[frame_count] = {}
            pose_data[frame_count][f"person_{person_id}"] = mediapipe_data
            
            # Get nose keypoint (or any other keypoint) to place the ID text
            if len(keypoints) > 0:
                nose_x, nose_y = int(keypoints[0][0]), int(keypoints[0][1])
                # Draw person ID
                cv2.putText(display_frame, f"ID: {person_id}", 
                           (nose_x, nose_y - 30),  # Position above nose
                           cv2.FONT_HERSHEY_SIMPLEX, 
                           1, (0, 255, 0), 2)
    
    # Visualize the results with pose estimation
    annotated_frame = results[0].plot()
    
    # Add the person IDs to the annotated frame
    if len(results) > 0:
        for person_id, person_keypoints in enumerate(results[0].keypoints.data):
            keypoints = person_keypoints.cpu().numpy()
            if len(keypoints) > 0:
                nose_x, nose_y = int(keypoints[0][0]), int(keypoints[0][1])
                cv2.putText(annotated_frame, f"ID: {person_id}", 
                           (nose_x, nose_y - 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 
                           1, (0, 255, 0), 2)
    
    cv2.imshow('YOLOv8 Pose Estimation', annotated_frame)
    
    # Save pose data every 100 frames
    if frame_count % 100 == 0 and frame_count > 0:
        with open(f'pose_data_{frame_count}.json', 'w') as f:
            json.dump(pose_data, f, indent=4)
        pose_data = {}  # Reset for next batch
    
    frame_count += 1
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        # Save any remaining pose data
        if pose_data:
            with open(f'pose_data_final.json', 'w') as f:
                json.dump(pose_data, f, indent=4)
        break

cap.release()
cv2.destroyAllWindows()