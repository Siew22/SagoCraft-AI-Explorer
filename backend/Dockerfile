# 明确指定 Python 版本，不让它乱动
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖 (OpenCV 需要)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制我们冷冻好的 requirements.txt
COPY requirements.txt .

# 强制按照锁定的版本安装
RUN pip install --no-cache-dir -r requirements.txt

# 这一步非常关键：为了 DeepFace，在镜像里预设环境变量
ENV TF_USE_LEGACY_KERAS=1

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]