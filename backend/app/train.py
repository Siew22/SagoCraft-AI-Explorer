# backend/app/train.py

import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from app.ai_model import SagoActionModel # 导入我们之前写的模型

# --- 1. 自定义视频数据集加载器 ---
class SagoVideoDataset(Dataset):
    def __init__(self, root_dir, num_frames=16):
        self.root_dir = root_dir
        self.num_frames = num_frames
        self.classes = ["roasting", "sifting", "other"]
        self.video_paths = []
        self.labels = []
        
        # 遍历文件夹，读取视频路径和标签
        for class_idx, class_name in enumerate(self.classes):
            class_dir = os.path.join(root_dir, class_name)
            if not os.path.exists(class_dir):
                continue
            for file in os.listdir(class_dir):
                if file.endswith(('.mp4', '.avi', '.mov')):
                    self.video_paths.append(os.path.join(class_dir, file))
                    self.labels.append(class_idx)

    def __len__(self):
        return len(self.video_paths)

    def __getitem__(self, idx):
        video_path = self.video_paths[idx]
        label = self.labels[idx]
        
        # 用 OpenCV 读取视频并均匀抽帧
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        # 防止有的视频太短
        if total_frames < self.num_frames:
            indices = np.arange(self.num_frames) % total_frames
        else:
            indices = np.linspace(0, total_frames - 1, self.num_frames, dtype=int)
            
        frames = []
        for frame_idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                frame = cv2.resize(frame, (224, 224)) # MobileNetV2 需要的尺寸
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame = frame.transpose((2, 0, 1)) / 255.0 # (C, H, W) 并归一化
                frames.append(frame)
            else:
                frames.append(np.zeros((3, 224, 224))) # 读取失败用黑图补齐
        cap.release()
        
        # 转换为 PyTorch Tensor: (Frames, C, H, W)
        video_tensor = torch.tensor(np.array(frames), dtype=torch.float32)
        return video_tensor, torch.tensor(label, dtype=torch.long)

# --- 2. 核心训练逻辑 ---
def train_model():
    # 参数设置
    batch_size = 4  # 因为你有 12GB 显存，设为 4 比较安全
    num_epochs = 10
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🚀 开始训练！使用设备: {device}")

    # 加载数据 (请确保你的 dataset 文件夹在正确的位置)
    train_dataset = SagoVideoDataset(root_dir="../dataset/train", num_frames=16)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    # 初始化模型
    model = SagoActionModel(num_classes=3).to(device)
    
    # 损失函数和优化器
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.0001)

    # 开始循环训练
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for i, (videos, labels) in enumerate(train_loader):
            videos, labels = videos.to(device), labels.to(device)
            
            optimizer.zero_grad()
            
            # 前向传播 (Forward)
            outputs, _ = model(videos)
            loss = criterion(outputs, labels)
            
            # 反向传播 (Backward)
            loss.backward()
            optimizer.step()
            
            # 统计数据
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        epoch_loss = running_loss / len(train_loader)
        epoch_acc = 100 * correct / total
        print(f"Epoch [{epoch+1}/{num_epochs}] -> Loss: {epoch_loss:.4f}, Accuracy: {epoch_acc:.2f}%")

    # 训练结束，保存模型！(这就是我们要拿去塞进 Docker 里的最终大脑)
    torch.save(model.state_dict(), "sago_model.pth")
    print("✅ 训练完成！模型已保存为 sago_model.pth")

if __name__ == "__main__":
    train_model()