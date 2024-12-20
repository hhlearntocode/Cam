import cv2
import numpy as np
import os
from queue import Queue
from threading import Thread
from collections import deque
from ultralytics import YOLO
from collections import deque
import tensorflow as tf

class RealTimeViolenceDetector:
    def __init__(self, 
                child_detection_model='yolov8s-detect-upfront.pt',
                violence_model_path='MoBiLSTM.keras',
                input_resolution=(224, 224),
                detect_confidence_threshold=0.7,
                max_queue_size=30,
                SEQUENCE_LENGTH=16,
                CLASSES_LIST=['NonViolence', 'Violence'],
                IMAGE_HEIGHT=64,
                IMAGE_WIDTH=64):
        self.child_detector = YOLO(child_detection_model)
        self.MoBiLSTM_model = tf.keras.models.load_model(violence_model_path)
        self.input_resolution = input_resolution
        self.child_confidence_threshold = detect_confidence_threshold
        self.SEQUENCE_LENGTH = SEQUENCE_LENGTH
        self.CLASSES_LIST = CLASSES_LIST
        self.IMAGE_HEIGHT = IMAGE_HEIGHT
        self.IMAGE_WIDTH = IMAGE_WIDTH
        self.frame_queue = Queue(maxsize=max_queue_size)
        self.result_queue = Queue(maxsize=max_queue_size)
        self.is_processing = True

    def predict_frames(self, video_file_path=0, output_file_path=None):
        violence_frames_dir = 'violence_frames'
        os.makedirs(violence_frames_dir, exist_ok=True)
        # Read from the video file.
        video_reader = cv2.VideoCapture(video_file_path)

        # Track consecutive violence frames``
        consecutive_violence_frames = 0
        violence_frame_indices = []

        # Get the width and height of the video.
        original_video_width = int(video_reader.get(cv2.CAP_PROP_FRAME_WIDTH))
        original_video_height = int(video_reader.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # VideoWriter to store the output video in the disk.
        video_writer = cv2.VideoWriter(output_file_path, cv2.VideoWriter_fourcc(*'mp4v'),
                                        video_reader.get(cv2.CAP_PROP_FPS), (original_video_width, original_video_height))

        # Declare a queue to store video frames.
        frames_queue = deque(maxlen=self.SEQUENCE_LENGTH)

        # Frame counter to track current frame
        frame_counter = 0
        violence_detected_info = None

        # Iterate until the video is accessed successfully.
        while video_reader.isOpened():
            ok, frame = video_reader.read()

            if not ok:
                break

            # Resize the Frame to fixed Dimensions.
            resized_frame = cv2.resize(frame, (self.IMAGE_HEIGHT, self.IMAGE_WIDTH))

            # Normalize the resized frame
            normalized_frame = resized_frame / 255

            # Appending the pre-processed frame into the frames list.
            frames_queue.append(normalized_frame)

            # Check if the number of frames in the queue are equal to the fixed sequence length.
            if len(frames_queue) == self.SEQUENCE_LENGTH:
                # Pass the normalized frames to the model and get the predicted probabilities.
                predicted_labels_probabilities = self.MoBiLSTM_model.predict(np.expand_dims(frames_queue, axis=0))[0]

                # Get the index of class with highest probability.
                predicted_label = np.argmax(predicted_labels_probabilities)

                # Get the class name using the retrieved index.
                predicted_class_name = self.CLASSES_LIST[predicted_label]

                # Check for violence detection on individual frames
                if predicted_class_name == "Violence":
                    consecutive_violence_frames += 1
                    violence_frame_indices.append(frame_counter)

                    # If 16 consecutive violence frames detected
                    if consecutive_violence_frames == 16 and violence_detected_info is None:
                        confidence_score = predicted_labels_probabilities[predicted_label]

                        # Save the violence frames
                        for idx, frame_idx in enumerate(violence_frame_indices):
                            video_reader.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                            ok, violence_frame = video_reader.read()
                            if ok:
                                violence_frame_path = os.path.join(
                                    violence_frames_dir,
                                    f'violence_frame_{frame_idx}.jpg'
                                )
                                cv2.imwrite(violence_frame_path, violence_frame)

                        # Retrieve the final frame of violence detection
                        video_reader.set(cv2.CAP_PROP_POS_FRAMES, violence_frame_indices[-1])
                        ok, final_violence_frame = video_reader.read()
                        final_violence_frame_path = None
                        if ok:
                            final_violence_frame_path = os.path.join(
                                violence_frames_dir,
                                f'final_violence_frame_{violence_frame_indices[-1]}.jpg'
                            )
                            cv2.imwrite(final_violence_frame_path, final_violence_frame)

                        # Save violence detection info
                        violence_detected_info = {
                            'label': predicted_class_name,
                            'confidence_score': float(confidence_score),
                            'final_violence_frame_path': final_violence_frame_path,
                            'final_frame_index': violence_frame_indices[-1]
                        }
                else:
                    # Reset consecutive violence frames if not a violence frame
                    consecutive_violence_frames = 0
                    violence_frame_indices.clear()

                # Annotate the frame with prediction
                if predicted_class_name == "Violence":
                    cv2.putText(
                        frame,
                        f"{predicted_class_name} (Consecutive: {consecutive_violence_frames})",
                        (5, 100),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 0, 255),
                        4
                    )
                else:
                    cv2.putText(
                        frame,
                        predicted_class_name,
                        (5, 100),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        3,
                        (0, 255, 0),
                        12
                    )

            # Write the frame to the output video
            video_writer.write(frame)

            # Increment frame counter
            frame_counter += 1

        # Close the video reader and writer
        video_reader.release()
        video_writer.release()

        # Return violence detection info if available
        return violence_detected_info
    def predict_frames2(self, video_file_path=0):
        violence_frames_dir = 'violence_frames'
        os.makedirs(violence_frames_dir, exist_ok=True)

        # Read from the video file
        video_reader = cv2.VideoCapture(video_file_path)

        # Track consecutive violence frames
        consecutive_violence_frames = 0
        violence_frame_indices = []

        # Declare a queue to store video frames
        frames_queue = deque(maxlen=self.SEQUENCE_LENGTH)

        # Frame counter
        frame_counter = 0
        violence_detected_info = None

        # Iterate through video frames
        while video_reader.isOpened():
            ok, frame = video_reader.read()

            if not ok:
                break

            # Resize and normalize the frame
            resized_frame = cv2.resize(frame, (self.IMAGE_HEIGHT, self.IMAGE_WIDTH))
            normalized_frame = resized_frame / 255
            frames_queue.append(normalized_frame)

            # Check if the queue is filled
            if len(frames_queue) == self.SEQUENCE_LENGTH:
                # Predict using the model
                predicted_labels_probabilities = self.MoBiLSTM_model.predict(np.expand_dims(frames_queue, axis=0))[0]
                predicted_label = np.argmax(predicted_labels_probabilities)
                predicted_class_name = self.CLASSES_LIST[predicted_label]

                # Detect violence
                if predicted_class_name == "Violence":
                    consecutive_violence_frames += 1
                    violence_frame_indices.append(frame_counter)

                    # If 16 consecutive frames detected
                    if consecutive_violence_frames == 16 and violence_detected_info is None:
                        confidence_score = predicted_labels_probabilities[predicted_label]

                        # Retrieve the final frame of violence detection
                        video_reader.set(cv2.CAP_PROP_POS_FRAMES, violence_frame_indices[-1])
                        ok, final_violence_frame = video_reader.read()
                        final_violence_frame_path = None
                        if ok:
                            final_violence_frame_path = os.path.join(
                                violence_frames_dir,
                                f'Violenceframe.jpg'
                            )
                            cv2.imwrite(final_violence_frame_path, final_violence_frame)

                        # Save violence detection info
                        violence_detected_info = {
                            'label': predicted_class_name,
                            'confidence_score': float(confidence_score),
                            'final_violence_frame_path': final_violence_frame_path,
                            'final_frame_index': violence_frame_indices[-1]
                        }
                else:
                    # Reset if no violence
                    consecutive_violence_frames = 0
                    violence_frame_indices.clear()

            # Increment frame counter
            frame_counter += 1

        # Release the video reader
        video_reader.release()

        # Return violence detection info
        return violence_detected_info


    def predict_video(self, video_file_path):

        video_reader = cv2.VideoCapture(video_file_path)

        # Declare a list to store video frames we will extract.
        frames_list = []

        # Store the predicted class in the video.
        predicted_class_name = ''

        # Get the number of frames in the video.
        video_frames_count = int(video_reader.get(cv2.CAP_PROP_FRAME_COUNT))

        # Calculate the interval after which frames will be added to the list.
        skip_frames_window = max(int(video_frames_count/self.SEQUENCE_LENGTH),1)

        # Iterating the number of times equal to the fixed length of sequence.
        for frame_counter in range(self.SEQUENCE_LENGTH):

            # Set the current frame position of the video.
            video_reader.set(cv2.CAP_PROP_POS_FRAMES, frame_counter * skip_frames_window)

            success, frame = video_reader.read()

            if not success:
                break

            # Resize the Frame to fixed Dimensions.
            resized_frame = cv2.resize(frame, (self.IMAGE_HEIGHT, self.IMAGE_WIDTH))

            # Normalize the resized frame.
            normalized_frame = resized_frame / 255

            # Appending the pre-processed frame into the frames list
            frames_list.append(normalized_frame)

        # Passing the  pre-processed frames to the model and get the predicted probabilities.
        predicted_labels_probabilities = self.MoBiLSTM_model.predict(np.expand_dims(frames_list, axis = 0))[0]

        # Get the index of class with highest probability.
        predicted_label = np.argmax(predicted_labels_probabilities)

        # Get the class name using the retrieved index.
        predicted_class_name = self.CLASSES_LIST[predicted_label]

        video_reader.release()

        # Display the predicted class along with the prediction confidence.
        return f'Predicted: {predicted_class_name}\nConfidence: {predicted_labels_probabilities[predicted_label]}'

        

    def detect_children(self, frame):
        """
        Detect children in the frame using YOLO with configurable confidence threshold
        """
        results = self.child_detector(frame, conf=self.child_confidence_threshold, classes=[0]) 
        return len(results[0].boxes) > 0

def main():
    detector = RealTimeViolenceDetector(
        child_detection_model='yolov8s-detect-upfront.pt',
        violence_model_path='MoBiLSTM.keras'
    )
    
    # Example usage of frame-by-frame prediction
    result = detector.predict_frames2() #video_path, khong de gi la dung webcam
    print(result)
    # Example usage of whole video prediction
    #print(detector.predict_video("test1.mp4"))


if __name__ == "__main__":
    main()