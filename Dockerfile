# Sử dụng Python base image
FROM python:3.11.10-slim

# Thiết lập thư mục làm việc
  
EXPOSE 8501
# Cài đặt các công cụ hệ thống cần thiết
RUN apt-get update && apt-get install -y \
    build-essential\
    software-properties-common\
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app  
# Copy requirements.txt
COPY requirements.txt .
COPY audio_classification.py .
COPY violence_detection.py .
COPY app.py .

# Cài đặt các dependencies Python
RUN pip3 install -r requirements.txt
# Thiết lập command mặc định
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]