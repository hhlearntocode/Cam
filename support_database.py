import cv2
import mtcnn
import face_recognition
from PIL import Image
import numpy as np
from scipy.spatial.distance import cosine
from PIL import Image   
from io import BytesIO  



from expopushnoti import save_notification_with_image_to_firestore, send_notification

import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage

face_detector = mtcnn.MTCNN()

"""
    Về phía người dùng
    B1: Người dùng push ảnh học sinh (thực hiện ở app)
    B2: Chờ trích xuất ảnh vector đặc trưng

    Về phía lập người lập trình
    B1: Lấy hết ảnh học sinh về và lưu vào mảng students ví dụ [image, id]
    B2: detect_and_save_face để trích xuất đặc trưng của image 
    B3: cập nhật thêm mảng vector đặc trưng của student trên firebase 
"""

"""
hàm kết nối firebase
"""
def dbConnection():
    if not firebase_admin._apps:
        cred = credentials.Certificate("soictallday.json")
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'blogapp-cf07c.appspot.com'
        })
    db = firestore.client()
    return db


"""
Hàm này để trả về 1 mảng gồm những phần tử gồm 2 thông tin [imageUrl, id]
imageUrl là cái link dẫn thẳng tới ảnh học sinh trên google
"""
def get_all_student_data_with_image_and_id():
    db = dbConnection()
    students = db.collection('students').stream()
    student_data = []
    for student in students:
        student_data.append([student.to_dict().get("imageUrl"), student.id])
    return student_data

"""
Hàm trích xuất các đặc điểm trên khuôn mặt thành 1 cái mảng thông qua 1 image_path
"""
def detect_and_save_face(image_path):
    image = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
    # Detect faces sử dụng MTCNN
    faces = face_detector.detect_faces(image_rgb)
        
    detected_faces = []
    
    if len(faces) > 0:
        for face in faces:
            # Lấy tọa độ khuôn mặt
            x, y, w_box, h_box = face['box']
            
            # Kiểm tra giới hạn tọa độ
            h, w, _ = image_rgb.shape
            x = max(0, x)
            y = max(0, y)
            w_box = min(w_box, w - x)
            h_box = min(h_box, h - y)
            
            face_img = image_rgb[y:y+h_box, x:x+w_box]
            
            # Kiểm tra kích thước khuôn mặt
            if face_img.shape[0] < 20 or face_img.shape[1] < 20:
                print("Face too small to process")
                continue
            
            # Tạo face embedding
            try:
                face_img_np = np.array(Image.fromarray(face_img))
                face_embedding = face_recognition.face_encodings(face_img_np)[0]
                
                detected_face_info = {
                    'embedding': face_embedding,
                    'bbox': {
                        'x': x,
                        'y': y,
                        'width': w_box,
                        'height': h_box
                    }
                }
                
                detected_faces.append(detected_face_info)
                print(f"Detected face at ({x}, {y}, {w_box}, {h_box})")
            except IndexError:
                print("No encodings found for this face.")
            except Exception as e:
                print(f"Error creating embedding: {e}")
    else:
        print("No faces detected")
    
    return detected_faces
    
"""
Hàm trích xuất các đặc điểm trên khuôn mặt thành 1 cái mảng thông qua 1 image_np
"""
def detect_and_save_face_from_np(image_np):
    """
    Detect and save face embeddings from an image
    """
    # Chuyển sang RGB nếu chưa đúng định dạng
    image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    
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
                print(f"Detected face at ({x}, {y}, {w}, {h})")
            except Exception as e:
                print(f"Error creating embedding: {e}")
    else:
        print("No faces detected")
    
    return detected_faces

"""
Hàm trích xuất các đặc điểm trên khuôn mặt thành 1 cái mảng thông qua 1 link
"""
def detect_and_save_face_from_url(url):
    try:
        # Tải ảnh từ URL
        response = requests.get(url)
        image = Image.open(BytesIO(response.content))         
        image_np = np.array(image)                            
        image_rgb = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR) 
        
        return detect_and_save_face_from_np(image_rgb)
    except Exception as e:
        print(f"Error processing image from URL: {e}")
        return []

"""
Chuyển đổi face_data (numpy array) sang định dạng tương thích với Firestore.
"""
def serialize_face_data(face_data):
    serialized_data = []
    for data in face_data:
        embedding = data.get('embedding')
        bbox = data.get('bbox')

        # Convert numpy array to list
        if isinstance(embedding, np.ndarray):
            embedding = embedding.tolist()

        serialized_data.append({
            'embedding': embedding,
            'bbox': bbox
        })
    return serialized_data

"""
Tạo mảng gồm những phần tử gồm 2 thông tin [vector, id]
"""
def create_face_data_with_id():
    db = dbConnection()  # Kết nối Firestore
    res = [] 
    students = db.collection('students').stream()

    for student in students:
        student_data = student.to_dict()
        image_url = student_data.get("imageUrl")
        student_id = student.id

        if image_url:
            face_data = detect_and_save_face_from_url(image_url)
            serialized_face_data = serialize_face_data(face_data)

            if serialized_face_data:
                res.append({
                    'student_id': student_id,
                    'embedding': serialized_face_data
                })
            else:
                print(f"No face detected for student {student_id}")
        else:
            print(f"Student {student_id} does not have a valid imageUrl.")
    
    return res

"""
Cập nhật cơ sở dữ liệu Firestore: lưu vector đặc trưng vào từng tài liệu của sinh viên.
"""
def update_student_database_with_face_embeddings():
    db = dbConnection()  # Kết nối Firestore
    face_database = create_face_data_with_id()

    # Cập nhật từng tài liệu với vector đặc trưng
    for entry in face_database:
        student_id = entry['student_id']
        embedding = entry['embedding']

        try:
            db.collection('students').document(student_id).update({
                'face_embedding': embedding
            })
            print(f"Updated face embedding for student {student_id}.")
        except Exception as e:
            print(f"Error updating embedding for student {student_id}: {e}")

"""
Tìm path bức ảnh có nhiều khuôn mặt nhất trong list path
"""
def find_most_appearing_faces_file_path(list_file_path):
    """
    Tìm đường dẫn bức ảnh có nhiều khuôn mặt nhất trong danh sách đường dẫn ảnh.
    """
    max_faces = 0
    best_file_path = None

    for file_path in list_file_path:
        try:
            # Đọc ảnh
            image = cv2.imread(file_path)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Detect faces
            faces = face_detector.detect_faces(image_rgb)
            num_faces = len(faces)

            # Cập nhật nếu tìm thấy ảnh có nhiều khuôn mặt hơn
            if num_faces > max_faces:
                max_faces = num_faces
                best_file_path = file_path
            
            print(f"Found {num_faces} faces in {file_path}.")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"The file with the most faces is {best_file_path} with {max_faces} faces.")
    return best_file_path

"""
    Lấy tất cả thông tin vector đặc trưng (face embeddings) của các khuôn mặt trong database Firestore.
    Trả về mảng gồm các list [vector, id] của từng sinh viên.
"""
def get_vector_embeddings_face_database():
    db = dbConnection()  
    embeddings_data = []  
    
    # Truy vấn toàn bộ sinh viên từ Firestore
    students = db.collection('students').stream()

    # Duyệt qua từng sinh viên và lấy thông tin vector đặc trưng
    for student in students:
        student_data = student.to_dict()
        student_id = student.id
        face_embedding = student_data.get('face_embedding')

        # Kiểm tra nếu có face_embedding
        if face_embedding:
            embeddings_data.append([face_embedding, student_id])
        else:
            print(f"Student {student_id} does not have a face embedding.")
    
    return embeddings_data

"""
So sánh vector đặc trưng của face trong list_file_path với firebase
"""
def match_faces_to_database(list_file_path, similarity_threshold=0.5):
    """
    Tìm file ảnh có nhiều khuôn mặt nhất, trích xuất vector đặc trưng và so sánh với cơ sở dữ liệu Firebase.

    Args:
        list_file_path (list): Danh sách đường dẫn đến các file ảnh.
        similarity_threshold (float): Ngưỡng để xác định khuôn mặt phù hợp (0-1).

    Returns:
        list: Danh sách các ID sinh viên có khuôn mặt trong ảnh.
    """
    # Bước 1: Tìm file ảnh có nhiều khuôn mặt nhất
    best_face_path = find_most_appearing_faces_file_path(list_file_path)

    if not best_face_path:
        print("No valid file path found with faces.")
        return []

    # Bước 2: Trích xuất vector đặc trưng từ ảnh
    detected_faces = detect_and_save_face(best_face_path)

    if not detected_faces:
        print("No faces detected in the selected file.")
        return []

    # Chuyển các embedding của khuôn mặt thành danh sách
    list_face_embeddings = [face['embedding'] for face in detected_faces]

    # Bước 3: Lấy vector đặc trưng từ cơ sở dữ liệu Firebase
    face_database = get_vector_embeddings_face_database()

    # Chuyển cơ sở dữ liệu thành dictionary để dễ thao tác
    face_database_dict = {}
    for db_entry in face_database:
        db_embeddings = db_entry[0]  # Vector đặc trưng
        student_id = db_entry[1]  # ID sinh viên

        # Một ID có thể có nhiều vector (nếu lưu trữ nhiều khuôn mặt)
        if student_id not in face_database_dict:
            face_database_dict[student_id] = db_embeddings
        else:
            face_database_dict[student_id].extend(db_embeddings)

    # Bước 4: So sánh các vector đặc trưng với cơ sở dữ liệu
    matched_ids_set = set()

    for embedding in list_face_embeddings:
        # So sánh với từng vector trong cơ sở dữ liệu
        for db_id, db_embeddings in face_database_dict.items():
            for db_embedding in db_embeddings:
                # Tính cosine distance
                cosine_distance = cosine(embedding, db_embedding)

                # Chuyển đổi cosine distance thành cosine similarity (1 - distance)
                similarity = 1 - cosine_distance

                # Nếu similarity vượt qua ngưỡng, thêm ID vào danh sách kết quả
                if similarity >= similarity_threshold:
                    matched_ids_set.add(db_id)

    # Trả về danh sách các ID (loại bỏ trùng lặp)
    return list(matched_ids_set)

"""
Tìm phụ huynh của đứa trẻ
"""
def find_parent(idStudent):
    db = dbConnection()
    student = db.collection('students').document(idStudent).get()
    parent = student.get('userId')
    return parent


"""
Gọi hàm này thì tất cả face trong database sẽ được cập nhật
"""
update_student_database_with_face_embeddings()

if __name__ == "__main__":
    # testfile=========================================================
    list_file_path = [f"testFace/{i}.jpg" for i in range(1, 17)]

    idListStudent = match_faces_to_database(list_file_path)

    print(idListStudent)

    message = "Phát hiện nguy hiểm!"
    imageUrl = find_most_appearing_faces_file_path(list_file_path)

    for idStudent in idListStudent:

        idUser = find_parent(idStudent)

        save_notification_with_image_to_firestore(idUser, message, imageUrl)
        send_notification(idUser, message)



#Can be improve by using FAISS for much faster speed and scalability

# def match_faces_to_database(face_embeddings, face_database, similarity_threshold=0.5):
#     results = {}

#     for idx, embedding in enumerate(face_embeddings):
#         matched_ids = []
        
#         for db_id, db_embedding in face_database.items():
#             similarity = 1 - cosine(embedding, db_embedding)  # Convert cosine distance to similarity (1 = identical)
            
#             if similarity >= similarity_threshold:
#                 matched_ids.append({'id': db_id, 'score': similarity})
        
#         # Sort matched IDs by similarity score in descending order
#         matched_ids = sorted(matched_ids, key=lambda x: x['score'], reverse=True)
#         results[idx] = matched_ids

#     return results