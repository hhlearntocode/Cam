
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage
from extract_OSNET import createOSNETDatabase

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


def find_parent(idStudent):
    db = dbConnection()
    student = db.collection('students').document(idStudent).get()
    parent = student.get('userId')
    return parent

import requests
import os

# Hàm tải ảnh từ URL và lưu vào máy tính
def download_image(image_url, student_id, save_dir="OSNET"):
    # Tạo thư mục lưu trữ nếu chưa tồn tại
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    try:
        # Gửi yêu cầu HTTP để tải ảnh
        response = requests.get(image_url, stream=True)
        if response.status_code == 200:
            # Đường dẫn lưu ảnh
            file_path = os.path.join(save_dir, f"{student_id}.jpg")
            # Lưu nội dung ảnh vào file
            with open(file_path, "wb") as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)
            print(f"Downloaded: {student_id}")
        else:
            print(f"Failed to download image for {student_id}: HTTP {response.status_code}")
    except Exception as e:
        print(f"Error downloading image for {student_id}: {e}")

#Buoc dau tien khi co tre em moi duoc them vao
"""
Những hàm dưới đây khi chạy cùng lúc sẽ tiến hành tải các ảnh (học sinh) từ firebase xuống
Hàm createOSNETDatabase dùng để tạo ra file embeddings.
"""
list_student = get_all_student_data_with_image_and_id()
for image_url, student_id in list_student:
    if image_url:  
        download_image(image_url, student_id)
    else:
        print(f"No image URL found for {student_id}")
createOSNETDatabase()