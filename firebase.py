import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# gửi thông báo
from firebase_config import messaging


def dbConnection():
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

    app = firebase_admin.initialize_app(cred)

    db = firestore.client()


# test push seeding data
def pushData(data):

    # dummy data
    data = {
        "id": "1",
        "title": "Person",
        "camera": "1",
        "time": "3:49 PM",
        "day": "2023-12-07",
        "videoUrl": "https://example.com/video1.mp4",
    }

    # push new data to firebase
    db.collection("notifications").document("noti").set(data)


# Hàm lấy token từ users
# truyền vào list ID của Users
def get_user_tokens(id_list):

    tokens = []

    for user_id in id_list:
        doc = db.collection("user").document(user_id).get()

        if doc.exists:
            user_data = doc.to_dict()
            if "fcmToken" in user_data:
                tokens.append(user_data["fcmToken"])

    return tokens


# Hàm gửi thông báo
def sendNotification(id_list, title, body, data_payload=None):
    """
    Gửi thông báo đến danh sách người dùng.

    :param id_list: List các ID người dùng (token FCM).
    :param title: Tiêu đề thông báo.
    :param body: Nội dung thông báo.
    :param data_payload: Thêm dữ liệu tùy chỉnh (dict).
    """
    if not id_list:
        print("Danh sách ID người dùng trống!")
        return

    # Tạo thông báo
    message = messaging.MulticastMessage(
        tokens=id_list,
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=data_payload or {},
    )

    # Gửi thông báo
    response = messaging.send_multicast(message)
    print(f"Đã gửi thông báo đến {response.success_count} người dùng.")
    if response.failure_count > 0:
        print(f"Thông báo thất bại cho {response.failure_count} người dùng:")
        for error in response.responses:
            if not error.success:
                print(f" - Error: {error.exception}")


def sendNotiToUsers(idList):
    user_tokens = get_user_tokens(idList)

    sendNotification(
        id_list=user_tokens,
        title="Cảnh báo từ Camera!",
        body="Con bạn đang có dấu hiệu bị bạo lực hãy kiểm tra!",
        data_payload={"idChild": "child1", "priority": "high"},
    )
