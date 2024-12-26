import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage


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
        firebase_admin.initialize_app(
            cred, {"storageBucket": "blogapp-cf07c.appspot.com"}
        )
    db = firestore.client()
    return db


"""
Hàm này để trả về 1 mảng gồm những phần tử gồm 2 thông tin [imageUrl, id]
imageUrl là cái link dẫn thẳng tới ảnh học sinh trên google
"""
# def get_all_student_data_with_image_and_id():
#     db = dbConnection()
#     students = db.collection('students').stream()
#     student_data = []
#     for student in students:
#         student_data.append([student.to_dict().get("imageUrl"), student.id])
#     return student_data

"""
SỬA HÀM NÀY
lấy hết embedding -> nếu chưa có thì add list -> cập nhật lại lên database
"""


def get_all_student_data_with_image_and_id():
    db = dbConnection()
    students = db.collection("students").stream()

    student_data = []

    student_without_embedding = []

    for student in students:
        # if student.to_dict().get("face_embedding") is None:
        # student_without_embedding.append(
        #     [
        #         student.to_dict().get("name"),
        #         student.to_dict().get("imageUrl"),
        #         student.id,
        #     ]
        # )
        student_data.append(
            [
                student.to_dict().get("name"),
                student.to_dict().get("imageUrl"),
                student.id,
            ]
        )
        print(student.to_dict().get("imageUrl"))
        # student_data.append([student.to_dict().get("imageUrl"), student.id])

    # return student_without_embedding
    return student_data


"""
Cập nhật lại embedding của student trên firebase
"""


# def update_embedding(student_id, embedding):
#     db = dbConnection()

#     student = db.collection("students").document(student_id)

#     try:
#         student_data = student.get().to_dict()

#         # CẬP NHẬT LẠI EMBEDDING
#         # cho student khi không có trường embdedding hoặc student up ảnh mới (khác embedding đã extract)
#         if "embedding" not in student_data:
#             # Cập nhật trường embedding
#             student.update({"embedding": embedding})
#         else:
#             try:
#                 if student_data["embedding"] != embedding:
#                     student.update({"embedding": embedding})
#             except Exception as e:
#                 print("Lỗi khi cập nhật embedding: ", e)
#         print(
#             f"Cập nhật embedding thành công cho studentId: {student_id} - {student_data["name"]}"
#         )
#     except Exception as e:
#         print(f"Lỗi khi truy cập tài liệu: {e}")

import numpy as np

def update_embedding(student_id, embedding):
    db = dbConnection()
    student = db.collection("students").document(student_id)

    try:
        student_data = student.get().to_dict()

        # Kiểm tra nếu document không tồn tại
        if not student_data:
            print(f"Document cho studentId {student_id} không tồn tại.")
            return

        # CẬP NHẬT EMBEDDING
        if "embedding" not in student_data:
            # Thêm trường embedding mới
            student.update({"embedding": str(embedding)})
        else:
            try:
                # So sánh vector embedding
                current_embedding = np.array(student_data["embedding"])
                
                print(f"{type(current_embedding)} - {type(student_data["embedding"])}  ")

                if str(current_embedding) != str(embedding):
                    student.update({"embedding": str(embedding)})
                
                print(f"Cập nhật embedding thành công cho studentId: {student_id} - {student_data['name']}")
            except Exception as e:
                print("Lỗi khi cập nhật embedding: ", e)

    except Exception as e:
        print(f"Lỗi khi truy cập tài liệu: {e}")

# =====================================================================================
# CÁC MÁY KHÁC CHỈ CẦN GỌI HÀM NÀY
# =====================================================================================
def get_all_embedding():
    """
    Hàm lấy tất cả embedding của student

    return: dictionary embeddings[student_id]
    """

    db = dbConnection()

    # Dictionary để lưu trữ kết quả
    embeddings = {}

    try:
        # Truy vấn tất cả các tài liệu trong collection "students"
        students = db.collection("students").stream()

        for student in students:
            student_id = student.id
            student_data = student.to_dict()

            # Lấy embedding nếu tồn tại
            if "embedding" in student_data:
                embeddings[student_id] = np.array(student_data["embedding"])
            else:
                embeddings[student_id] = None  # Gán None nếu không có embedding

        print(f"Lấy dữ liệu embedding thành công: {len(embeddings)} mục.")
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu embedding: {e}")

    return embeddings


# =====================================================================================
def find_parent(idStudent):
    db = dbConnection()
    student = db.collection("students").document(idStudent).get()
    parent = student.get("userId")
    return parent


import requests
import os


# Hàm tải ảnh từ URL và lưu vào máy tính
def download_image(name, image_url, student_id, save_dir="OSNET"):
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
            print(f"Downloaded: {student_id} --- {name}")
        else:
            print(
                f"Failed to download image for {student_id}: HTTP {response.status_code}"
            )
    except Exception as e:
        print(f"Error downloading image for {student_id}: {e}")


# Buoc dau tien khi co tre em moi duoc them vao
"""
Những hàm dưới đây khi chạy cùng lúc sẽ tiến hành tải các ảnh (học sinh) từ firebase xuống
Hàm createOSNETDatabase dùng để tạo ra file embeddings.
"""

"""
Tương lai sẽ cập nhật khi user gửi request (edit ảnh)

Các cam khi khởi chạy sẽ clone hết embedding về lưu ở local sau (mỗi time_set) sẽ cập nhật lại database

!!! HIỆN TẠI CHỈ CẬP NHẬT EMBEDDING TRÊN DATABASE
VẪN SỬ DỤNG EMBEDDING Ở LOCAL VÌ ĐỘ HIỆU QUẢ CỦA NÓ

________

Khi user edit ảnh cần load lại embedding 

(giảm thời gian, tuy nhiên test thì không cần thiết)
code app: người dùng thay đổi ảnh -> cập nhật trường "edit" = true
server load: nếu edit = true thì load và extract embedding, cập nhật
sau đó gán edit = false

"""

list_student = get_all_student_data_with_image_and_id()
for name, image_url, student_id in list_student:
    if image_url:
        download_image(name, image_url, student_id)
    else:
        print(f"No image URL found for {name} - {student_id}")

from extract_OSNET import createOSNETDatabase
createOSNETDatabase()
# ========================================================
"""
LẤY TẤT CẢ EMBEDDING
"""
# dic = get_all_embedding()
# print(dic)
# ========================================================

# for id, em in dic:
#     print(f"{id} - {em}")
# def test():
#     dataset_folder = "OSNET"  # Thư mục chứa dataset ảnh
#     output_file = "embeddings.npy"  # Tên file .npy muốn lưu
#     embeddings = {}

#     for file_name in os.listdir(dataset_folder):
#         file_path = os.path.join(dataset_folder, file_name)
#         if file_name.lower().endswith(
#             (".jpg", ".jpeg", ".png", ".webp")
#         ):  # Chỉ đọc ảnh
#             print(f"Processing: {file_name.rsplit('.', 1)[0]}")
#             # try:
#             # Trích xuất embedding
#             # embedding = extract_features(model, file_path)
#             # Lưu vào dictionary với key là tên file (hoặc tên người)
#             # embeddings[file_name] = embedding
#             # except Exception as e:
#             #     print(f"Error processing {file_name}: {e}")

#     # Lưu dictionary dưới dạng file .npy
#     # np.save(output_file, embeddings)
#     print(f"Embeddings saved to {output_file}")


# test()
