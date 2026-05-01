# ======================================================
# --- 模块重定向黑客补丁 (Module Redirect Patch) ---
# 解决 DeepFace 找不到 tensorflow.keras 的终极方案
# ======================================================
import os
import sys

# 1. 强行开启遗留 Keras 模式
os.environ["TF_USE_LEGACY_KERAS"] = "1"

try:
    import tf_keras as keras
    # 2. 核心魔法：告诉 Python，如果有人找 'tensorflow.keras'，就直接把 'tf_keras' 给他
    sys.modules['tensorflow.keras'] = keras
    print("✅ 成功映射 tensorflow.keras -> tf-keras")
except ImportError:
    print("❌ 映射失败：请确保已运行 pip install tf-keras")
# ======================================================

# --- 接下来才是你原本的业务代码 ---
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np

# 注意这里：由于我们刚才在 main.py 所在的根目录运行，这里的 import 必须根据你的目录结构微调
from app.perception_pipeline import analyze_single_frame
from app.bayesian import get_action_from_detections, get_quality_probability

app = FastAPI(title="SagoCraft AI Master Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/scan_frame")
async def scan_frame(file: UploadFile = File(...)):
    # 1. 接收图片
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return {"status": "error", "message": "Invalid image format"}

    # 2. 视觉分析 (调用更新后的感知脚本)
    vision_results = analyze_single_frame(frame)
    
    # 3. 贝叶斯逻辑推断
    action_name, is_standard = get_action_from_detections(vision_results['detected_objects'])
    quality_score = get_quality_probability(is_standard_action=is_standard)
    
    # 4. 返回给 Flutter
    return {
        "status": "success",
        "action_recognized": action_name,
        "vision_details": vision_results,
        "bayesian_inference": {
            "quality_probability": quality_score,
            "insight": f"Current action '{action_name}' detected. Quality prediction is active."
        }
    }

@app.get("/")
def check():
    return {"message": "Sago AI Backend is ready with custom model!"}