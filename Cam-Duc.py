import cv2
import torch
import numpy as np
from ultralytics import YOLO
from torchvision.models import mobilenet_v3_small, MobileNetV3
import torch.nn as nn
import torch.nn.functional as F
from threading import Thread
from queue import Queue
import time
import os


class LightweightViolenceDetector(nn.Module):
    def __init__(self, num_classes=2, checkpoint_path='best_mobilenet_v3.pth'):
        super().__init__()
        # Use MobileNetV3 as base model for efficiency
        self.backbone = mobilenet_v3_small(pretrained=False)  # Keep pretrained=True
        
        # Correctly determine the last channel size
        last_channel = self.backbone.classifier[0].in_features
        
        # Modify the classifier for violence detection BEFORE loading checkpoint
        self.backbone.classifier = nn.Sequential(
            nn.Linear(last_channel, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes)
        )
        
        # Load checkpoint
        if os.path.exists(checkpoint_path):
            self.load_checkpoint(checkpoint_path)
        
    def load_checkpoint(self, checkpoint_path):
        try:
            # Load the checkpoint
            checkpoint = torch.load(checkpoint_path, map_location='cpu')
            
            # Handle different checkpoint formats
            state_dict = checkpoint.get('model_state_dict', checkpoint)
            
            # Remove any 'model.' or 'backbone.' prefix if present
            corrected_state_dict = {}
            for k, v in state_dict.items():
                if k.startswith('model.'):
                    corrected_state_dict[k.replace('model.', '')] = v
                elif k.startswith('backbone.'):
                    corrected_state_dict[k.replace('backbone.', '')] = v
                else:
                    corrected_state_dict[k] = v
            
            # Load the state dict
            self.load_state_dict(corrected_state_dict, strict=False)
            print("Checkpoint loaded successfully!")
        except Exception as e:
            print(f"Error loading checkpoint: {e}")
            
    def forward(self, x):
        return self.backbone(x)

class RealTimeViolenceDetector:
    def __init__(self, 
                child_detection_model='yolov8s-detect-upfront.pt',
                violence_model_path='best_mobilenet_v3.pth',
                input_resolution=(224, 224),
                detect_confidence_threshold=0.7,
                violence_confidence_threshold=0.5,
                max_queue_size=30):
        # Device configuration
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Models
        self.child_detector = YOLO(child_detection_model)
        
        # Violence detection model
        self.violence_model = LightweightViolenceDetector(
            num_classes=2, 
            checkpoint_path=violence_model_path
        )
        
        self.violence_model.to(self.device)
        self.violence_model.eval()
        
        # Processing parameters
        self.input_resolution = input_resolution
        self.child_confidence_threshold = detect_confidence_threshold
        self.violence_confidence_threshold = violence_confidence_threshold
        
        # Frame processing queue
        self.frame_queue = Queue(maxsize=max_queue_size)
        self.result_queue = Queue(maxsize=max_queue_size)
        
        # Processing flags
        self.is_processing = True

    def preprocess_frame(self, frame):
        """
        Preprocess frame for neural network input
        """
        # Resize frame
        frame = cv2.resize(frame, self.input_resolution)
        
        # Convert to tensor
        frame_tensor = torch.from_numpy(frame).permute(2, 0, 1).float() / 255.0
        frame_tensor = frame_tensor.unsqueeze(0).to(self.device)
        
        return frame_tensor
    
    def enhance_image(self, frame):
        """
        Enhance image quality using basic image processing techniques.
        
        Args:
            frame (numpy.ndarray): Input frame (BGR image).
        
        Returns:
            numpy.ndarray: Enhanced frame.
        """
        # Convert to YUV color space for histogram equalization
        yuv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2YUV)
        yuv_frame[:, :, 0] = cv2.equalizeHist(yuv_frame[:, :, 0])  # Equalize histogram on the Y channel
        enhanced_frame = cv2.cvtColor(yuv_frame, cv2.COLOR_YUV2BGR)
        
        # Apply sharpening kernel
        sharpening_kernel = np.array([[0, -1, 0], 
                                    [-1, 5, -1], 
                                    [0, -1, 0]])
        enhanced_frame = cv2.filter2D(enhanced_frame, -1, sharpening_kernel)
        
        # Optionally apply noise reduction (e.g., bilateral filter)
        enhanced_frame = cv2.bilateralFilter(enhanced_frame, d=9, sigmaColor=75, sigmaSpace=75)
        
        return enhanced_frame

    def detect_children(self, frame):
        """
        Detect children in the frame using YOLO with configurable confidence threshold
        """
        results = self.child_detector(frame, conf=self.child_confidence_threshold, classes=[0]) 
        return len(results[0].boxes) > 0

    def detect_violence(self, frame_tensor):
        """
        Detect violence using lightweight model with configurable confidence threshold
        """
        with torch.no_grad():
            outputs = self.violence_model(frame_tensor)
            probabilities = F.softmax(outputs, dim=1)
            violence_prob = probabilities[0][1]
            
        return violence_prob > self.violence_confidence_threshold

    def frame_processing_thread(self):
        """
        Continuous frame processing thread
        """
        while self.is_processing:
            if not self.frame_queue.empty():
                frame, frame_time = self.frame_queue.get()
                
                # Check for children
                if self.detect_children(frame):
                    continue
                
                # Preprocess frame
                frame_tensor = self.preprocess_frame(frame)
                
                # Detect violence
                is_violent = self.detect_violence(frame_tensor)
                
                if is_violent:
                    # Put result in result queue
                    self.result_queue.put((frame, frame_time))

    def process_video(self, video_path):
        """
        Process video in real-time
        """
        # Start processing thread
        processing_thread = Thread(target=self.frame_processing_thread)
        processing_thread.start()
        
        # Video capture
        cap = cv2.VideoCapture(video_path)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Get current timestamp
            current_time = time.time()
            
            # Put frame in queue if not full
            if not self.frame_queue.full():
                self.frame_queue.put((frame, current_time))
            
            # Process results
            if not self.result_queue.empty():
                violent_frame, frame_time = self.result_queue.get()
                self.save_violent_frame(violent_frame, frame_time)
            
            # Optional: Add a small delay to prevent overwhelming the system
            time.sleep(0.01)
        
        # Stop processing
        self.is_processing = False
        processing_thread.join()
        
        cap.release()

    def save_violent_frame(self, frame, timestamp):
        """
        Save violent frame with timestamp after enhancing the image quality.
        """
        # Enhance the image quality
        enhanced_frame = self.enhance_image(frame)
        
        # Save the enhanced frame
        output_dir = 'violent_frames'
        os.makedirs(output_dir, exist_ok=True)
        
        filename = f'violent_frame_{timestamp}.jpg'
        filepath = os.path.join(output_dir, filename)
        
        cv2.imwrite(filepath, enhanced_frame)
        print(f"Violent frame detected and saved: {filename}")


def main():
    detector = RealTimeViolenceDetector(
        child_detection_model='yolov8s-detect-upfront.pt',
        violence_model_path='best_mobilenet_v3.pth',  
        input_resolution=(224, 224),
        detect_confidence_threshold=0.7,
        violence_confidence_threshold=0.3
    )
    
    detector.process_video("violence-dataset/fight1.mp4")

if __name__ == "__main__":
    main()

