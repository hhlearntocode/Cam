import requests
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage
from datetime import datetime
import os;
from pathlib import Path 

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

class User():
    def __init__(self, userId, name, email, password, tokenDevice, childIds, phone):
        self.userId = userId
        self.name = name
        self.email = email
        self.password = password
        self.tokenDevice = tokenDevice
        self.phone = phone
        self.childIds = childIds
class Student():
    def __init__(self, studentId, name, age, parentId):
        self.studentId = studentId
        self.name = name
        self.age = age
        self.parentId = parentId
class Notification():
    def __init__(self, notificationId, userId, studentId, camId, frameViolentUrl, message, day, time, status):
        self.notificationId = notificationId
        self.userId = userId
        self.studentId = studentId
        self.camId = camId
        self.frameViolentUrl = frameViolentUrl
        self.message = message
        self.day = day
        self.time = time
        self.status = status
class Camera():
    def __init__(self, camId, name, location, status):
        self.camId = camId
        self.name = name
        self.location = location
        self.status = status

# Connect to firebase
def dbConnection():
    if not firebase_admin._apps:
        cred = credentials.Certificate("soictallday.json")
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'blogapp-cf07c.appspot.com'
        })
    db = firestore.client()
    return db

# Save video
def save_video(video_url, camId, userId):
    db = dbConnection()
    videos_ref = db.collection('videos')
    video_data = {
        'url': video_url,
        'camId': camId,
        'userId': userId,
        'timestamp': firestore.SERVER_TIMESTAMP,
    }
    videos_ref.add(video_data)

# save frame
def save_frame_violent(frame_url, camId, userId):
    db = dbConnection()
    frames_ref = db.collection('frames')
    frame_data = {
        'url': frame_url,
        'camId': camId,
        'userId': userId,
        'timestamp': firestore.SERVER_TIMESTAMP,
    }
    frames_ref.add(frame_data)

def upload_image_to_storage(image_path, destination_blob_name):
    try:
        bucket = storage.bucket()  
        blob = bucket.blob(destination_blob_name)
        
        blob.upload_from_filename(image_path)

        blob.make_public()

        print(f"Image uploaded to {blob.public_url}")
        return blob.public_url
    except Exception as e:
        print(f"Error uploading image: {e}")
        return None

def normalize_image_path(image_path):
    if not image_path:
        raise ValueError("Đường dẫn không được để trống.")
    image_path = image_path.replace("\\", "/")
    return image_path

# Get list id user
def getListIdUser():
    db = dbConnection()
    users_ref = db.collection('user')
    docs = users_ref.stream()

    id_list = []
    for doc in docs:
        id_list.append(doc.id)  
    return id_list

# Get user token
def getUserToken(idUser):
    db = dbConnection()
    user_ref = db.collection('user').document(idUser)
    user_data = user_ref.get().to_dict()

    if user_data:
        return user_data.get('apiToken')  
    return None

# tạo thông báo mới với 3 yếu tố message, status, userId
def save_notification_to_firestore(message, status, userId):
    db = dbConnection()
    notifications_ref = db.collection('notifications')

    current_datetime = datetime.now()
    notification_data = {
        'message': message,
        'status': status,
        'timestamp': firestore.SERVER_TIMESTAMP,        # Use server timestamp for consistency
        'date': current_datetime.strftime('%Y-%m-%d'),  # Format date in YYYY-MM-DD for readability
        'time': current_datetime.strftime('%H:%M:%S'),  # Format time in HH:MM:SS for readability
        'userId': userId,
    }
    notifications_ref.add(notification_data)

# cập nhật trạng thái thông báo
def update_notification_status(notification_id, status):
    try:
        db = dbConnection()  
        notification_ref = db.collection('notifications').document(notification_id)

        notification_ref.update({
            'status': status
        })

        print(f"Notification {notification_id} status updated successfully!")
    except Exception as e:
        print(f"Error updating notification status: {e}")

# gửi thống báo cho iduser
def send_notification(idUser, message="Default message"):
    token = getUserToken(idUser)
    if not token:
        print(f"User {idUser} không có token hoặc không tồn tại.")
        update_notification_status(message, "failed", idUser)
        return

    try:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        data = {
            "to": token,
            "title": "Alert",
            "body": message,
        }
        response = requests.post(EXPO_PUSH_URL, json=data, headers=headers)
        response.raise_for_status()

        print(f"Notification sent successfully to {idUser}: {response.json()}")
        update_notification_status(message, "sent", idUser)

    except Exception as e:
        print(f"Error sending notification to {idUser}: {e}")
        update_notification_status(message, "failed", idUser)

def sanitize_path(path):
    return os.path.normpath(path)

# gửi thống báo cho nhieu người
def send_multiple_notifications(listUser, message="Default message"):
    for idUser in listUser:
        send_notification(idUser, message)

# tạo thông báo mới
def save_notification_with_image_to_firestore(idUser, message, image_path):
    db = dbConnection()
    notifications_ref = db.collection('notifications')

    image_url = upload_image_to_storage(image_path, f"notifications/{idUser}/{datetime.now().isoformat()}.jpg")
    if not image_url:
        print(f"Failed to upload image for user {idUser}")
        return

    current_datetime = datetime.now()
    notification_data = {
        'userId': idUser,
        'message': message,
        'imageUrl': image_url,  
        'status': "sent",
        'timestamp': firestore.SERVER_TIMESTAMP,
        'date': current_datetime.strftime('%Y-%m-%d'),
        'time': current_datetime.strftime('%H:%M:%S'),
    }
    notifications_ref.add(notification_data)
    print(f"Notification saved for user {idUser} with image URL {image_url}")

# gửi thống báo cho token
def send_push_notification(push_token, title, body):
    url = "https://exp.host/--/api/v2/push/send"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    data = {
        "to": push_token,  # Expo Push Token
        "title": title,
        "body": body,
        "data": {"extra": "data"},  # Optional
    }
    response = requests.post(url, json=data, headers=headers)
    print(response.status_code, response.json())








# Example usage:
# push_token = "ExponentPushToken[S0kV-2HARM0dOaSDE7NwMp]"
# send_push_notification(push_token, "hhhhahshaaasss", "Bất ngờ chưa bà già")

# userlist = getListIdUser()
# print(userlist)
# send_multiple_notifications(userlist, "hahaha")

# message = "Phát hiện nguy hiểm!"
# db = getListIdUser()

# image_path = r"violence_frames\final_violence_frame_98.jpg"
# normalized_path = Path(image_path).as_posix()

# for idUser in db:
#     save_notification_with_image_to_firestore(idUser, message, normalized_path)
#     send_notification(idUser, message)