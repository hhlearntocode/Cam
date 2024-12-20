import os
import numpy as np
from torchvision import transforms
from PIL import Image
import torchreid
import torch

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

def preprocess_image(image_path):
    """Tiền xử lý ảnh từ đường dẫn."""
    img = Image.open(image_path).convert('RGB')
    img = transform(img).unsqueeze(0)
    return img.to(device)

@torch.no_grad()
def extract_features(model, image_path):
    """Trích xuất embedding từ model."""
    img = preprocess_image(image_path)
    features = model(img)
    return features.cpu().numpy()

# --- 3. Tạo file .npy ---
def create_embeddings_file(dataset_folder, output_file='embeddings.npy'):
    """
    Tạo file .npy chứa các embedding cho từng ảnh trong dataset.
    
    Parameters:
    - dataset_folder (str): Đường dẫn đến thư mục chứa dataset.
    - output_file (str): Tên file .npy để lưu.
    """
    embeddings = {}
    for file_name in os.listdir(dataset_folder):
        file_path = os.path.join(dataset_folder, file_name)
        if file_name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):  # Chỉ đọc ảnh
            print(f"Processing: {file_name}")
            try:
                # Trích xuất embedding
                embedding = extract_features(model, file_path)
                # Lưu vào dictionary với key là tên file (hoặc tên người)
                embeddings[file_name] = embedding
            except Exception as e:
                print(f"Error processing {file_name}: {e}")
    
    # Lưu dictionary dưới dạng file .npy
    np.save(output_file, embeddings)
    print(f"Embeddings saved to {output_file}")

    """
   createOSNETDatabase: là hàm dùng để tạo file vector data để truy vấn (embeddings.npy)
    """
def createOSNETDatabase():
    dataset_folder = 'OSNET'  # Thư mục chứa dataset ảnh
    output_file = 'embeddings.npy'  # Tên file .npy muốn lưu
    create_embeddings_file(dataset_folder, output_file)