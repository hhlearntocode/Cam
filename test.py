
from FindIDViolence import getIDViolence
from expopushnoti import save_notification_with_image_to_firestore, send_notification
from support_database import find_parent
list_names, _ = getIDViolence("test__1.png")
print(list_names)
for v in list_names:
    idUser = find_parent(v.split('.')[0])
    message = "Co nguy hiem voi con cua ban"
    save_notification_with_image_to_firestore(idUser, message, "test__1.png")
    send_notification(idUser, message)