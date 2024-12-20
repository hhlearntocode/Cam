import torch
import torchreid
from scipy.spatial.distance import cosine
import numpy as np
from torchvision import transforms
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO

# --- 1. Tải model OSNet ---
model = torchreid.models.build_model(
    name='osnet_x1_0',
    num_classes=1,
    pretrained=True
)
model.eval()
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = model.to(device)

# --- 2. Tiền xử lý ảnh ---
transform = transforms.Compose([
    transforms.Resize((256, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def preprocess_image(image):
    """Tiền xử lý ảnh từ vùng bounding box."""
    img = transform(image).unsqueeze(0)  # Chuyển đổi thành batch tensor
    return img.to(device)

@torch.no_grad()
def extract_features(model, image):
    """Trích xuất đặc trưng từ một ảnh."""
    img = preprocess_image(image)
    features = model(img)
    return features.cpu().numpy()

# --- 3. Tải embedding dataset ---
def load_embeddings_cache(cache_file='embeddings.npy'):
    """Tải embedding từ file cache."""
    return np.load(cache_file, allow_pickle=True).item()

def find_best_match(query_features, embeddings):
    """Tìm người phù hợp nhất trong cache dựa trên khoảng cách cosine."""
    best_match = None
    min_distance = float('inf')
    for name, dataset_features in embeddings.items():
        # Tính khoảng cách cosine
        distance = cosine(query_features.flatten(), dataset_features.flatten())
        if distance < min_distance:
            min_distance = distance
            best_match = name

    return best_match, min_distance

# --- 4. Phát hiện người trong ảnh ---
def detect_people(image_path, conf_threshold=0.5):
    """Dùng YOLOv8 để phát hiện người và trả về bounding boxes."""
    model = YOLO("yolov8n.pt")  # Dùng YOLOv8 phiên bản nhỏ
    results = model(image_path)
    boxes = []
    for r in results[0].boxes:
        if r.cls == 0 and r.conf >= conf_threshold:  # Chỉ giữ lại các đối tượng là người
            x1, y1, x2, y2 = map(int, r.xyxy[0])  # Bounding box (x1, y1, x2, y2)
            boxes.append((x1, y1, x2, y2))
    return boxes

# --- 5. Vẽ bounding box và gắn tên ---
def draw_boxes(image_path, boxes, names):
    """Vẽ bounding boxes và gắn tên người lên ảnh."""
    image = Image.open(image_path).convert('RGB')
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("arial.ttf", size=20)  # Font chữ
    for box, name in zip(boxes, names):
        x1, y1, x2, y2 = box
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)  # Vẽ bounding box
        draw.text((x1, y1 - 10), name, fill="yellow", font=font)  # Gắn tên
    return image

# --- 6. Chương trình chính ---
def getIDViolence(input_image):
    cache_file = 'embeddings.npy'
    embeddings = load_embeddings_cache(cache_file)

    # Phát hiện người trong ảnh
    boxes = detect_people(input_image)
    print(f"Detected {len(boxes)} people in the image.")

    # Nhận diện từng người
    names = []
    distances = []
    for box in boxes:
        x1, y1, x2, y2 = box
        # Crop ảnh từ bounding box
        cropped_image = Image.open(input_image).convert('RGB').crop((x1, y1, x2, y2))
        # Trích xuất đặc trưng và tìm người phù hợp
        query_features = extract_features(model, cropped_image)
        name, distance = find_best_match(query_features, embeddings)
        names.append(name if distance < 0.6 else "Unknown")  # Ngưỡng nhận diện
        distances.append(distance)
    
    # Vẽ bounding box và tên người
    output_image = draw_boxes(input_image, boxes, names)
    output_image.show()  # Hiển thị ảnh
    output_image.save("output_image.jpg")  # Lưu ảnh kết quả
    return names, distances
if __name__ == "__main__":
    # Tải cache embedding
    dataset_folder = 'OSNET'  # Thư mục chứa dataset
    cache_file = 'embeddings.npy'
    embeddings = load_embeddings_cache(cache_file)

    # Ảnh đầu vào
    input_image = "ro.webp"

    # Phát hiện người trong ảnh
    boxes = detect_people(input_image)
    print(f"Detected {len(boxes)} people in the image.")

    # Nhận diện từng người
    names = []
    for box in boxes:
        x1, y1, x2, y2 = box
        # Crop ảnh từ bounding box
        cropped_image = Image.open(input_image).convert('RGB').crop((x1, y1, x2, y2))
        # Trích xuất đặc trưng và tìm người phù hợp
        query_features = extract_features(model, cropped_image)
        name, distance = find_best_match(query_features, embeddings)
        names.append(name if distance < 0.4 else "Unknown")  # Ngưỡng nhận diện

    # Vẽ bounding box và tên người
    output_image = draw_boxes(input_image, boxes, names)
    output_image.show()  # Hiển thị ảnh
    output_image.save("output_image.jpg")  # Lưu ảnh kết quả
