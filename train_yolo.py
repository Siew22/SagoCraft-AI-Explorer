# Sago_CNNs/train_yolo.py

import os
import torch

# ======================================================
# 【万能通行证补丁】必须放在所有 import 之前
# 强制关闭 PyTorch 的 weights_only 检查，允许加载 YOLO 模型
# ======================================================
_original_torch_load = torch.load
def _patched_torch_load(*args, **kwargs):
    # 强制将 weights_only 设为 False
    kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)
torch.load = _patched_torch_load
# ======================================================

from ultralytics import YOLO

def train_my_sago_model():
    # 1. 确认 GPU 是否亮起
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"🚀 准备点火！计算设备: {'GPU (显卡)' if device == '0' else 'CPU'}")

    # 2. 加载 YOLOv8 初始大脑
    # 现在的补丁会让这一步 100% 通过
    print("正在加载基础模型...")
    model = YOLO('yolov8s.pt') 

    # 3. 数据集路径
    yaml_path = r"C:\Users\Student\AppData\Local\Programs\Python\Python310\Sago_CNNs\Sago_Final_Dataset.v1-finally-ah-dataset.yolov8\data.yaml"

    if not os.path.exists(yaml_path):
        print(f"❌ 找不到文件！请检查路径: {yaml_path}")
        return

    # 4. 正式开始训练
    print("🔥 AI 模型正在 GPU 上闭关修炼 (50 轮)...")
    results = model.train(
        data=yaml_path,
        epochs=50,
        imgsz=640,
        batch=16,
        device=device,
        name='sago_yolo_final',
        exist_ok=True
    )

    print("\n\n✅ 恭喜！训练大功告成！")

if __name__ == "__main__":
    train_my_sago_model()