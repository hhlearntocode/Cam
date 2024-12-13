import cv2
import mtcnn
import face_recognition
from PIL import Image
import numpy as np

face_detector = mtcnn.MTCNN()

def detect_and_save_face(image_path):
        """
        Detect and save face embeddings from an image
        """
        # Đọc ảnh
        image = cv2.imread(image_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Detect faces sử dụng MTCNN
        faces = face_detector.detect_faces(image_rgb)
        
        detected_faces = []
        
        if len(faces) > 0:
            for face in faces:
                # Lấy tọa độ khuôn mặt
                x, y, w, h = face['box']
                
                # Cắt khuôn mặt
                face_img = image_rgb[y:y+h, x:x+w]
                
                # Chuyển sang định dạng phù hợp với face_recognition
                face_img_pil = Image.fromarray(face_img)
                
                # Tạo face embedding
                try:
                    face_embedding = face_recognition.face_encodings(
                        np.array(face_img_pil)
                    )[0]
                    
                    detected_face_info = {
                        'embedding': face_embedding,
                        'bbox': {
                            'x': x,
                            'y': y,
                            'width': w,
                            'height': h
                        }
                    }
                    
                    detected_faces.append(detected_face_info)
                    
                    print(f"Detected face")
                except Exception as e:
                    print(f"Error creating embedding: {e}")
        else:
            print("No faces detected")
        
        return detected_faces

from scipy.spatial.distance import cosine

def match_faces_to_database(face_embeddings, face_database, similarity_threshold=0.5):
    results = {}

    for idx, embedding in enumerate(face_embeddings):
        matched_ids = []
        
        for db_id, db_embedding in face_database.items():
            similarity = 1 - cosine(embedding, db_embedding)  # Convert cosine distance to similarity (1 = identical)
            
            if similarity >= similarity_threshold:
                matched_ids.append({'id': db_id, 'score': similarity})
        
        # Sort matched IDs by similarity score in descending order
        matched_ids = sorted(matched_ids, key=lambda x: x['score'], reverse=True)
        results[idx] = matched_ids

    return results


#Can be improve by using FAISS for much faster speed and scalability