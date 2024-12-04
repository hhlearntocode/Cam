import threading
import queue
import time
from audio_classification import audioProcess
from violence_detection import RealTimeViolenceDetector

class ViolenceMonitor:
    def __init__(self):
        # Create queues for inter-thread communication
        self.audio_queue = queue.Queue()
        self.video_queue = queue.Queue()
        
        # Event to signal threads to stop
        self.stop_event = threading.Event()
        
        # Locks for thread-safe operations
        self.print_lock = threading.Lock()

    def audio_thread(self):
        """
        Process audio in a separate thread.
        Captures audio, predicts sounds, and puts results in the queue.
        """
        audio_processor = audioProcess()
        while not self.stop_event.is_set():
            # try:
                # Record and predict audio for 10 seconds
                detected_sound, scores, text, violence_keywords, violence_sound = audio_processor.record_and_predict(
                    duration=10, 
                    device_port=1
                )
                
                # Prepare audio analysis results
                audio_elements = {
                    'detected_sound': detected_sound,
                    'scores': scores,
                    'text': text,
                    'violence_keywords': violence_keywords,
                    'violence_sound': violence_sound
                }
                
                audio_result = audio_processor.analyze_violence_rate(audio_elements["detected_sound"], audio_elements["scores"], audio_elements["text"])

                # Put results in the queue
                self.audio_queue.put(audio_result)
                
                # Small delay to prevent overwhelming the queue
                time.sleep(1)
            
            # except Exception as e:
            #     with self.print_lock:
            #         print(f"Error in audio thread: {e}")
            #     # Break the loop or continue based on your error handling strategy
            #     break

    def video_thread(self):
        """
        Process video in a separate thread.
        Detects violence in video stream.
        """
        video_detector = RealTimeViolenceDetector()
        while not self.stop_event.is_set():
            try:
                result = video_detector.predict_frames()
                
                # Put video results in the queue
                self.video_queue.put(result)
                
                # Small delay to prevent overwhelming the queue
                time.sleep(1)
            
            except Exception as e:
                with self.print_lock:
                    print(f"Error in video thread: {e}")
                break

    def analysis_thread(self):
        """
        Analyze violence from audio and video inputs.
        """
        while not self.stop_event.is_set():
            try:
                # Try to get results from audio and video queues
                audio_result = None
                video_result = None
                
                try:
                    audio_result = self.audio_queue.get(timeout=1)
                except queue.Empty:
                    pass
                
                try:
                    video_result = self.video_queue.get(timeout=1)
                except queue.Empty:
                    pass
                
                # Perform combined violence analysis
                if audio_result or video_result:
                    # Perform violence rate analysis
                    self.analyze_violence_rate(audio_result, video_result)
            
            except Exception as e:
                with self.print_lock:
                    print(f"Error in analysis thread: {e}")
                break

    def analyze_violence_rate(self, audio_data, video_data):
        """
        Analyze combined violence indicators from audio and video.
        
        :param audio_data: Dictionary of audio detection results
        :param video_data: Dictionary of video detection results
        """

        with self.print_lock:
            print("Analyzing violence indicators:")
            violence_weight = 0
            # Audio violence calculation (0.3 weight)
            if audio_data:
                print("Video Analysis:")
                print("  Video Detection:", audio_data.get("label"))
                print("  Confidence Score:", audio_data.get("confidence_score"))
                if audio_data.get("label") == "Violence" :
                    violence_weight += 0.3*audio_data.get("confidence_score")
                else:
                    violence_weight -= 0.3*audio_data.get("confidence_score")

            # Video violence calculation (0.7 weight)
            if video_data:
                print("Video Analysis:")
                print("  Video Detection:", video_data.get("label"))
                print("  Confidence Score:", video_data.get("confidence_score"))
                if video_data.get("label") == "Violence":
                    violence_weight += 0.7*video_data.get("confidence_score")
                else:
                    violence_weight -= 0.7*video_data.get("confidence_score")

            # Violence threshold and action logic
            if violence_weight > 0.7:
                print("HIGH VIOLENCE RISK DETECTED!")
                self.trigger_violence_alert(violence_weight, audio_data, video_data)
            elif violence_weight > 0.2:
                print("Moderate Violence Risk Detected")
            else:
                print("No Significant Violence Risk")

    def trigger_violence_alert(self, violence_weight, audio_data, video_data):
        """
        Trigger appropriate alerts based on violence detection.
        
        :param violence_weight: Total calculated violence weight
        :param audio_data: Audio detection results
        :param video_data: Video detection results
        """
        print("VIOLENCE ALERT TRIGGERED!")
        
        # Detailed logging of violence indicators
        if audio_data:
            print("Audio Violence Indicators:")
            print("  Keywords:", audio_data.get('violence_keywords', 'None'))
            print("  Detected Sounds:", audio_data.get('detected_sound', 'N/A'))
        
        if video_data:
            print("Video Violence Details:")
            print("  Confidence Score:", video_data.get('confidence_score', 'N/A'))
            print("  Final Violence Frame:", video_data.get('final_violence_frame_path', 'N/A'))
        
        # Additional alert mechanisms can be added here
        # For example: 
        # - Send SMS/Email
        # - Trigger local alarm
        # - Notify security personnel
        # - Save video evidence

    def start(self):
        """
        Start threads for audio, video, and analysis processing.
        """
        # Create threads
        audio_thread = threading.Thread(target=self.audio_thread, daemon=True)
        video_thread = threading.Thread(target=self.video_thread, daemon=True)
        analysis_thread = threading.Thread(target=self.analysis_thread, daemon=True)
        
        # Start threads
        audio_thread.start()
        video_thread.start()
        analysis_thread.start()
        
        try:
            # Keep main thread running
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            # Handle graceful shutdown
            with self.print_lock:
                print("Stopping threads...")
            self.stop_event.set()
            
            # Optional: Wait for threads to finish
            audio_thread.join()
            video_thread.join()
            analysis_thread.join()

def main():
    # Create and start the Violence Monitor
    monitor = ViolenceMonitor()
    monitor.start()

if __name__ == "__main__":
    main()