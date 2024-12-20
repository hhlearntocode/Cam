import sounddevice as sd
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
import soundfile
import pandas as pd
from scipy.io.wavfile import write
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import torch
class audioProcess:
    def __init__(self):
        self.yamnet_model = hub.load('https://www.kaggle.com/models/google/yamnet/TensorFlow2/yamnet/1')
        self.labels_path = "labels.csv"  
        self.labels = pd.read_csv(self.labels_path)
        self.class_names = self.labels['display_name'].to_list()
        self.violence_labels_weight = {
                                        "Child speech, kid speaking": 0.2,  
                                        "Babbling": 0.3,                  
                                        "Shout": 0.6,                      
                                        "Children shouting": 0.5,         
                                        "Screaming": 0.7,                  
                                        "Crying, sobbing": 0.8,           
                                        "Baby cry, infant cry": 0.9,       
                                        "Whimper": 0.6,                    
                                        "Wail, moan": 0.7,               
                                        "Slap, smack": 0.9,              
                                        "Smash, crash": 0.8,             
                                        "Breaking": 0.8,                
                                        "Glass": 1.0                      
                                    }
        self.violence_keywords_weight = {
            "mày": 0.6,   # Từ này mang tính xúc phạm trong ngữ cảnh bạo lực
            "tao": 0.6,    # Tương tự, đây là từ mang tính chất thách thức
            "má": 0.7,     # Từ này có thể mang tính bạo lực, thô lỗ
            "chó": 0.8,    # Thường dùng trong ngữ cảnh xúc phạm mạnh mẽ
            "đĩ": 0.9,     # Một từ mang tính chất xúc phạm và đe dọa
            "đụ": 0.9,     # Cũng là một từ rất nặng trong bối cảnh bạo lực
            "đánh": 0.8,   # Có thể được xem là từ có tính chất bạo lực
            "nín": 0.5,    # Mức độ nhẹ hơn, chỉ mang tính mệnh lệnh, nhưng có thể tạo áp lực
            "mẹ": 0.7,     # Từ này có thể mang nghĩa xúc phạm trong ngữ cảnh bạo lực
            "im": 0.4,     # Mệnh lệnh "im" có thể xuất hiện trong ngữ cảnh căng thẳng
            "thằng": 0.6,   # Từ này có thể là thô lỗ, xúc phạm trong nhiều trường hợp
            "tát": 0.8,     # Có thể được xem là từ có tính chất bạo lực
            "giết": 1
        }


        self.voice_processor = Wav2Vec2Processor.from_pretrained("nguyenvulebinh/wav2vec2-base-vietnamese-250h")
        self.voice_model = Wav2Vec2ForCTC.from_pretrained("nguyenvulebinh/wav2vec2-base-vietnamese-250h")

    
    def predict_with_yamnet(self, waveform, sr=16000):
        waveform = tf.convert_to_tensor(waveform, dtype=tf.float32)
        scores, embeddings, spectrogram = self.yamnet_model(waveform)
        predictions = tf.argmax(scores, axis=-1)  
        return predictions, scores
    
    def weight_audio_calculating(self, labels, scores):
        weight = 0
        for i, label in enumerate(labels):
            if label in self.violence_labels_weight: 
                print(label, self.violence_labels_weight[label], tf.reduce_max(scores[i]).numpy())
                weight += self.violence_labels_weight[label] * tf.reduce_max(scores[i]).numpy()
        return weight
    
    def weight_keyword_calculating(self, text):
        weight = 0
        for word in text.split(' '):
            if(word in self.violence_keywords_weight):
                weight += self.violence_keywords_weight[word]
        return weight
    
    def speech_to_text_from_waveform(self, waveform, sr=16000):
        inputs = self.voice_processor(waveform, sampling_rate=sr, return_tensors="pt", padding=True)
        with torch.no_grad():
            logits = self.voice_model(inputs.input_values).logits
        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = self.voice_processor.batch_decode(predicted_ids, skip_special_tokens=True)
        return transcription[0]

    def analyze_text_audio(self, text, labels):
        detected_keywords = [word for word in self.violence_keywords_weight if word in text]
        detected_sound = [sound for sound in self.violence_labels_weight if sound in labels]
        return detected_keywords, detected_sound

    def analyze_violence_rate(self, labels, scores, text):
        weight_audio = self.weight_audio_calculating(labels, scores)
        weight_keywords = self.weight_keyword_calculating(text)
        total_weight = weight_audio + weight_keywords
        if weight_audio > 0 and weight_keywords == 0:
            if any(label in ["Child speech, kid speaking", "Children shouting", "Crying, sobbing", "Baby cry, infant cry"] for label in labels):
                print("Trẻ em đang khóc trong môi trường học tập")
            if any(label in ["Slap, smack", "Breaking", "Glass", "Wail, moan", "Smash, crash"] for label in labels):
                print("Có dấu hiệu hành vi bạo hành trẻ em, xin vui lòng kiểm tra camera")
        
        elif weight_keywords > 0 and weight_audio == 0:
            print("Có những lời nói thô lỗ trong môi trường học tập của trẻ em")
        
        elif weight_audio > 0 and weight_keywords > 0:
            print("Trẻ em đang bị bạo hành, xin vui lòng kiểm tra camera")
        
        else:
            print("Không phát hiện bạo lực")

        # Chuẩn hóa score về thang điểm 0-1
        max_audio_weight = max(self.violence_labels_weight.values())  # Trọng số lớn nhất của âm thanh
        max_keyword_weight = max(self.violence_keywords_weight.values())  # Trọng số lớn nhất của từ khóa
        normalized_score = total_weight / (max_audio_weight + max_keyword_weight)
        
        if normalized_score > 0.2:
            return {
                "label" : "Violence",
                "confidence_score" : float(normalized_score)
            }
        else:
            return {
                "label" : "NonViolence",
                "confidence_score" : float(normalized_score)
            }


    def record_and_predict(self, duration=5, sr=16000, device_port = 1):
        waveform = sd.rec(int(duration * sr), samplerate=sr, channels=1, dtype='float32', device=device_port)
        sd.wait()
        waveform = np.squeeze(waveform)
        predictions, scores = self.predict_with_yamnet(waveform, sr=sr)
        detected = []
        for i in predictions.numpy():
            class_name = str(self.labels[self.labels['index'] == i]['display_name'].values[0])
            detected.append(class_name)
        text = self.speech_to_text_from_waveform(waveform, sr=sr)
        detected_keywords, detected_sound = self.analyze_text_audio(text, detected)
        return detected, scores, text, detected_keywords, detected_sound
    
    def wavPrediction(self, file_path, sr=16000):
        """
        Predict audio events and extract information from an audio file.
        
        Args:
            file_path (str): Path to the audio file (.wav format).
            sr (int): Sample rate to resample the audio (default: 16000).
        
        Returns:
            detected (list): List of detected audio event names.
            scores (ndarray): Scores associated with each detected event.
            text (str): Transcribed speech text from the audio.
            detected_keywords (list): Keywords extracted from the transcribed text.
            detected_sound (list): Sounds detected in the audio.
        """
        # Load audio file
        waveform, file_sr = soundfile.read(file_path)
        
        # If stereo audio, convert to mono
        if len(waveform.shape) > 1:
            waveform = np.mean(waveform, axis=1)  # Average across channels
        
        # Resample audio if needed
        if file_sr != sr:
            import librosa
            waveform = librosa.resample(waveform, orig_sr=file_sr, target_sr=sr)
        
        # Run YAMNet prediction
        predictions, scores = self.predict_with_yamnet(waveform, sr=sr)
        
        # Map predicted indices to class names
        detected = []
        for i in predictions.numpy():
            class_name = str(self.labels[self.labels['index'] == i]['display_name'].values[0])
            detected.append(class_name)
        
        # Perform speech-to-text on the audio
        text = self.speech_to_text_from_waveform(waveform, sr=sr)
        
        # Analyze the detected audio events and transcribed text
        detected_keywords, detected_sound = self.analyze_text_audio(text, detected)
        
        return detected, scores, text, detected_keywords, detected_sound
    