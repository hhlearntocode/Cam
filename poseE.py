from ultralytics import YOLO
import cv2
import numpy as np
import argparse
import os
import json
from datetime import datetime

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

def draw_pose_info(frame, results):
    """Draw pose information directly on the frame and return pose data"""
    if not results or len(results) == 0:
        return frame, {}
    
    # Get frame dimensions
    h, w = frame.shape[:2]
    
    # Initialize pose data dictionary for this frame
    pose_data = {
        'timestamp': datetime.now().isoformat(),
        'frame_dimensions': {'width': w, 'height': h},
        'people': []
    }
    
    # Draw number of people detected
    num_people = len(results[0].keypoints.data)
    cv2.putText(frame, f"People detected: {num_people}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    # Process each person's keypoints
    for person_id, keypoints in enumerate(results[0].keypoints.data):
        # Convert keypoints to numpy array
        keypoints_np = keypoints.cpu().numpy()
        
        # Calculate average confidence
        confidences = keypoints_np[:, 2]
        avg_conf = float(np.mean(confidences[confidences > 0])) if len(confidences) > 0 else 0
        
        # Store person data
        person_data = {
            'person_id': person_id,
            'average_confidence': avg_conf,
            'keypoints': convert_keypoints_to_dict(keypoints_np)
        }
        pose_data['people'].append(person_data)
        
        # Get nose position (keypoint 0) for ID placement
        nose_x, nose_y = int(keypoints_np[0][0]), int(keypoints_np[0][1])
        
        # Draw person ID and confidence
        id_text = f"ID {person_id}: {avg_conf:.2f}"
        cv2.putText(frame, id_text, (nose_x, nose_y - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
        
        # Draw all keypoints and their confidence scores
        for i, (x, y, conf) in enumerate(keypoints_np):
            if conf > 0.5:
                x, y = int(x), int(y)
                cv2.circle(frame, (x, y), 4, (0, 255, 0), -1)
                point_text = f"{i}: {conf:.2f}"
                cv2.putText(frame, point_text, (x + 5, y + 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
                
        # Draw skeleton lines between keypoints
        skeleton = [
            [5, 7], [7, 9], [6, 8], [8, 10],  # arms
            [11, 13], [13, 15], [12, 14], [14, 16],  # legs
            [5, 6], [5, 11], [6, 12], [11, 12]  # torso
        ]
        
        for start_point, end_point in skeleton:
            if keypoints_np[start_point][2] > 0.5 and keypoints_np[end_point][2] > 0.5:
                start_pos = (int(keypoints_np[start_point][0]), int(keypoints_np[start_point][1]))
                end_pos = (int(keypoints_np[end_point][0]), int(keypoints_np[end_point][1]))
                cv2.line(frame, start_pos, end_pos, (0, 255, 255), 2)
    
    return frame, pose_data

def main():
    parser = argparse.ArgumentParser(description='YOLO Pose Detection Visualization')
    parser.add_argument('--source', type=str, default='0',
                      help='Source for video capture (0 for webcam or video path)')
    parser.add_argument('--model', type=str, default='yolov8n-pose.pt',
                      help='Path to YOLO pose model')
    parser.add_argument('--save-interval', type=int, default=30,
                      help='Save pose data every N frames')
    args = parser.parse_args()

    # Create data directory if it doesn't exist
    data_dir = 'data'
    os.makedirs(data_dir, exist_ok=True)

    # Load YOLO model
    model = YOLO(args.model)
    
    # Setup video capture
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
            
        # Run YOLO pose detection
        results = model(frame, verbose=False)
        
        # Draw pose information on frame and get pose data
        frame, pose_data = draw_pose_info(frame, results)
        
        # Add frame number to pose data and collect it
        if pose_data:
            pose_data['frame_number'] = frame_count
            batch_pose_data.append(pose_data)
        
        # Save pose data at specified intervals
        if frame_count % args.save_interval == 0 and batch_pose_data:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(data_dir, f'pose_data_{timestamp}_frame_{frame_count}.json')
            save_pose_data(batch_pose_data, filename)
            print(f"Saved pose data to {filename}")
            batch_pose_data = []  # Clear the batch after saving
        
        # Display frame
        cv2.imshow('YOLO Pose Detection', frame)
        
        frame_count += 1
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            # Save any remaining pose data before quitting
            if batch_pose_data:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = os.path.join(data_dir, f'pose_data_{timestamp}_final.json')
                save_pose_data(batch_pose_data, filename)
                print(f"Saved final pose data to {filename}")
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()