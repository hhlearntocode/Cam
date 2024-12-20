import streamlit as st
import soundfile as sf
import numpy as np
import librosa
from audio_classification import audioProcess
from moviepy.editor import VideoFileClip
from violence_detection import RealTimeViolenceDetector
from FindIDViolence import getIDViolence
from expopushnoti import save_notification_with_image_to_firestore, send_notification
from support_database import find_parent
if 'audioModel' not in st.session_state and 'videoModel' not in st.session_state:
    st.session_state['audioModel'] = audioProcess()
    st.session_state['videoModel'] = RealTimeViolenceDetector()

def video_to_audio(video_file, output_audio_path="output_audio.wav"):
    """Chuyển đổi video sang file WAV."""
    clip = VideoFileClip(video_file)
    clip.audio.write_audiofile(output_audio_path, fps=16000)
    return output_audio_path

def main():
    a = st.session_state['audioModel']
    videoModel = st.session_state['videoModel']
    st.title("Video Audio Prediction with Streamlit")
    
    # Phần tải file video
    uploaded_file = st.file_uploader("Upload a Video file", type=["mp4", "mkv", "avi", "mov"])
    
    if uploaded_file is not None:
        st.video(uploaded_file)  

        # Lưu file video tạm thời
        temp_video_path = "temp_video.mp4"
        with open(temp_video_path, "wb") as f:
            f.write(uploaded_file.read())
        
        check1 = videoModel.predict_frames2(temp_video_path)
        st.write(check1)
        # Chuyển đổi video sang WAV
        audio_path = video_to_audio(temp_video_path, output_audio_path="converted_audio.wav")
        
        # Đọc file WAV từ video
        waveform, file_sr = sf.read(audio_path)
        
        # Chuyển đổi sang mono nếu cần
        if len(waveform.shape) > 1:
            waveform = np.mean(waveform, axis=1)
        
        # Resample nếu sample rate khác với mô hình
        target_sr = 16000
        if file_sr != target_sr:
            waveform = librosa.resample(waveform, orig_sr=file_sr, target_sr=target_sr)
        
        # Gọi mô hình để dự đoán
        detected_sound, scores, text, violence_keywords, violence_sound = a.wavPrediction(audio_path)
        
        # Hiển thị kết quả
        st.subheader("Prediction Results")
        st.write("Detected sounds:", detected_sound)
        st.write("Detected text:", text)
        st.write("Violence sound:", violence_sound)
        if violence_keywords:
            st.write("Detected violent keywords:", violence_keywords)
        else:
            st.write("No violent keywords detected.")
        if(check1 != None):
            list_names, list_distance = getIDViolence("violence_frames/Violenceframe.jpg")
            for i, v in enumerate(list_names):
                if list_distance[i] < 0.6:
                    idUser = find_parent(v.split('.')[0])
                    message = "Co nguy hiem voi con cua ban"
                    save_notification_with_image_to_firestore(idUser, message, "violence_frames/Violenceframe.jpg")
                    #send_notification(idUser, message)
            st.image("output_image.jpg")

if __name__ == "__main__":
    main()
