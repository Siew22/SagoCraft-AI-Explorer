import os
import sys
import cv2
import numpy as np

# --- 1. 核心补丁 (保留之前的 Keras 修复) ---
os.environ["TF_USE_LEGACY_KERAS"] = "1"
import tf_keras as keras
sys.modules['tensorflow.keras'] = keras

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # 新增
from fastapi.responses import FileResponse    # 新增

from app.perception_pipeline import analyze_single_frame
from app.bayesian import get_action_from_detections, get_quality_probability

app = FastAPI()

# 允许跨域 (虽然合一后不需要了，但保留以防万一)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 核心黑科技：挂载前端文件夹 ---
# 假设你的目录结构是 Sago_CNNs/frontend/index.html
# 我们告诉 FastAPI：去上一层目录找 frontend 文件夹
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))

# 接口：AI 检测
@app.post("/api/scan_frame")
async def scan_frame(file: UploadFile = File(...), track: str = Form("false")):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None: return {"status": "error"}

    is_tracking = True if track.lower() == "true" else False
    vision_results = analyze_single_frame(frame, track=is_tracking)
    action_name, is_standard = get_action_from_detections(vision_results['detected_objects'])
    quality_score = get_quality_probability(is_standard_action=is_standard)
    
    return {
        "status": "success",
        "action_recognized": action_name,
        "vision_details": vision_results,
        "bayesian_inference": {"quality_probability": quality_score, "insight": f"Action: {action_name}"}
    }

# --- 重点：让 FastAPI 直接吐出你的 HTML 页面 ---
@app.get("/")
async def read_index():
    return FileResponse(os.path.join(frontend_path, 'index.html'))

# 挂载 CSS, JS 和 图片文件夹
app.mount("/", StaticFiles(directory=frontend_path), name="static")
