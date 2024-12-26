import cv2
import torch
import numpy as np
from ultralytics import YOLO
from deep_sort_pytorch.utils.parser import get_config
from deep_sort_pytorch.deep_sort import DeepSort
from collections import deque

class ToddlerTracker:
    def __init__(self, yolo_weights, deep_sort_config):
        # Initialize YOLO model
        self.model = YOLO(yolo_weights)
        
        # Initialize DeepSort
        cfg_deep = get_config()
        cfg_deep.merge_from_file(deep_sort_config)
        self.deepsort = DeepSort(cfg_deep.DEEPSORT.REID_CKPT,
                                 max_dist=cfg_deep.DEEPSORT.MAX_DIST, 
                                 min_confidence=cfg_deep.DEEPSORT.MIN_CONFIDENCE,
                                 nms_max_overlap=cfg_deep.DEEPSORT.NMS_MAX_OVERLAP, 
                                 max_iou_distance=cfg_deep.DEEPSORT.MAX_IOU_DISTANCE,
                                 max_age=cfg_deep.DEEPSORT.MAX_AGE, 
                                 n_init=cfg_deep.DEEPSORT.N_INIT, 
                                 nn_budget=cfg_deep.DEEPSORT.NN_BUDGET,
                                 use_cuda=True)
        
        # Tracking variables
        self.data_deque = {}

    def xyxy_to_xywh(self, xyxy):
        """Convert XYXY bounding box to XYWH format."""
        bbox_left = min([xyxy[0].item(), xyxy[2].item()])
        bbox_top = min([xyxy[1].item(), xyxy[3].item()])
        bbox_w = abs(xyxy[0].item() - xyxy[2].item())
        bbox_h = abs(xyxy[1].item() - xyxy[3].item())
        x_c = (bbox_left + bbox_w / 2)
        y_c = (bbox_top + bbox_h / 2)
        return x_c, y_c, bbox_w, bbox_h

    def process_frame(self, frame):
        """Process a single frame for tracking."""
        # Perform object detection
        results = self.model(frame)[0]
        
        # Prepare data for DeepSort
        xywh_bboxs = []
        confs = []
        oids = []
        
        # Ensure there are detections
        if results.boxes is not None and len(results.boxes) > 0:
            for detection in results.boxes:
                # Convert XYXY to XYWH
                x1, y1, x2, y2 = detection.xyxy[0].tolist()
                x_c = (x1 + x2) / 2
                y_c = (y1 + y2) / 2
                bbox_w = abs(x2 - x1)
                bbox_h = abs(y2 - y1)
                
                xywh_bboxs.append([x_c, y_c, bbox_w, bbox_h])
                confs.append(detection.conf.item())
                
                # Use class index from pre-trained model directly
                oids.append(int(detection.cls.item()))
            
            # Convert to tensors
            xywhs = torch.tensor(xywh_bboxs, dtype=torch.float32)
            confss = torch.tensor(confs, dtype=torch.float32)
            oids_tensor = torch.tensor(oids, dtype=torch.int32)
            
            # Update DeepSort
            outputs = self.deepsort.update(xywhs, confss, oids_tensor, frame)
            
            # Process tracking results
            if len(outputs) > 0:
                bbox_xyxy = outputs[:, :4]
                identities = outputs[:, -2]
                object_types = outputs[:, -1]
                
                frame = self.draw_boxes(frame, bbox_xyxy, identities, object_types)
        
        return frame

    def draw_boxes(self, img, bbox, identities, object_types):
        """Draw bounding boxes and tracking information."""
        # Remove tracked points for lost objects
        for key in list(self.data_deque):
            if key not in identities:
                self.data_deque.pop(key)
        
        for i, box in enumerate(bbox):
            x1, y1, x2, y2 = [int(coord) for coord in box]
            
            # Get object center
            center = (int((x2+x1)/ 2), int((y2+y1)/2))
            
            # Get object ID
            id = int(identities[i]) if identities is not None else 0
            
            # Determine object type from pre-trained model
            obj_type = 'Toddler' if object_types[i] == 0 else 'Non-Toddler'
            
            # Create or update object buffer
            if id not in self.data_deque:  
                self.data_deque[id] = deque(maxlen=64)
            
            # Choose color based on object type
            color = (0, 255, 0) if obj_type == 'Toddler' else (255, 0, 0)
            
            # Create label
            label = f'{obj_type} ID:{id}'
            
            # Add center to buffer
            self.data_deque[id].appendleft(center)
            
            # Draw bounding box
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            cv2.putText(img, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
            
            # Draw tracking trail
            for j in range(1, len(self.data_deque[id])):
                if self.data_deque[id][j-1] is None or self.data_deque[id][j] is None:
                    continue
                thickness = int(np.sqrt(64 / float(j + j)) * 1.5)
                cv2.line(img, self.data_deque[id][j-1], self.data_deque[id][j], color, thickness)
        
        return img

    def track_video(self, video_path, output_path=None):
        """Track objects in a video."""
        cap = cv2.VideoCapture(video_path)
        
        # Video writer setup if output path is provided
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, 
                                  cap.get(cv2.CAP_PROP_FPS), 
                                  (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), 
                                   int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))))
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process frame
            processed_frame = self.process_frame(frame)
            
            # Display or write frame
            cv2.imshow('Toddler Tracking', processed_frame)
            if output_path:
                out.write(processed_frame)
            
            # Exit on 'q' key press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        if output_path:
            out.release()
        cv2.destroyAllWindows()

def main():
    # Paths to your YOLO and DeepSort weights and config
    YOLO_WEIGHTS = 'yolov8s-detect-upfront.pt'
    DEEP_SORT_CONFIG = 'deep_sort_pytorch/configs/deep_sort.yaml'
    VIDEO_PATH = 'test1.mp4'
    OUTPUT_PATH = 'output_video.mp4'
    
    # Initialize tracker
    tracker = ToddlerTracker(YOLO_WEIGHTS, DEEP_SORT_CONFIG)
    
    # Track video
    tracker.track_video(VIDEO_PATH, OUTPUT_PATH)

if __name__ == "__main__":
    main()