# ==============================================================
# SagoCraft AI Explorer - Unified Full-Stack Server
# Author: Siew22
# Version: 3.0 (Production Ready for Docker & Vercel)
# ==============================================================

import os
import sys
import cv2
import numpy as np
import logging
from datetime import datetime

# --- 1. 核心兼容性补丁 (Must be first) ---
os.environ["TF_USE_LEGACY_KERAS"] = "1"
try:
    import tf_keras as keras
    sys.modules['tensorflow.keras'] = keras
    print("✅ [System] Keras redirect patch active.")
except ImportError:
    print("⚠️ [System] tf-keras not found. DeepFace features might fail.")

# --- 2. 导入核心框架 ---
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import sessionmaker, declarative_base

# --- 3. 导入 AI 业务逻辑 ---
from app.perception_pipeline import analyze_single_frame
from app.bayesian import get_action_from_detections, get_quality_probability

# --- 4. 配置日志 (Professional Logging) ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SagoServer")

# --- 5. 数据库配置 (Adaptive DB Connection) ---
# 无论是在本地 3307 还是 Docker 3306，逻辑都能自动识别
if os.getenv("DOCKER_ENV") == "1":
    # Docker 内部环境：使用服务名 'db'
    DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:sago_password@db:3306/sago_db")
    logger.info("🚀 Environment: DOCKER. Connecting to db:3306")
else:
    # 本地直接运行环境：使用 localhost:3307
    DATABASE_URL = "mysql+pymysql://root:sago_password@127.0.0.1:3307/sago_db"
    logger.info("💻 Environment: LOCAL. Connecting to 127.0.0.1:3307")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 6. 数据库模型定义 ---
class DetectionLog(Base):
    __tablename__ = "detection_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action_recognized = Column(String(100))
    detected_objects = Column(Text)
    quality_probability = Column(Float)

# 初始化表结构
try:
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables synchronized.")
except Exception as e:
    logger.error(f"❌ Database error: {e}")

# --- 7. FastAPI 初始化与 CORS (Vercel 部署必备) ---
app = FastAPI(title="SagoCraft AI Master Server")

# 必须允许所有 Origin，否则 Vercel 的域名会被拦截
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 8. AI 逻辑路由 ---

@app.post("/api/scan_frame")
async def scan_frame(
    file: UploadFile = File(...), 
    track: str = Form("false")
):
    try:
        # 读取并解码图像
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # 1. 运行 AI 视觉感知 (YOLOv8-Track)
        is_tracking = True if track.lower() == "true" else False
        vision_results = analyze_single_frame(frame, track=is_tracking)
        
        # 2. 运行专家逻辑 (Bayesian)
        action_name, is_standard = get_action_from_detections(vision_results['detected_objects'])
        quality_score = get_quality_probability(is_standard_action=is_standard)
        
        # 3. 异步写入数据库 (Persistence)
        objects_str = ", ".join([obj['object_name'] for obj in vision_results.get('detected_objects', [])])
        db = SessionLocal()
        try:
            log_entry = DetectionLog(
                action_recognized=action_name,
                detected_objects=objects_str,
                quality_probability=quality_score
            )
            db.add(log_entry)
            db.commit()
        except Exception as db_err:
            logger.error(f"DB Write Failed: {db_err}")
            db.rollback()
        finally:
            db.close()
        
        return {
            "status": "success",
            "action_recognized": action_name,
            "vision_details": vision_results,
            "bayesian_inference": {
                "quality_probability": quality_score,
                "insight": f"Detected: {action_name}. Analysis complete."
            }
        }
    except Exception as e:
        logger.error(f"Processing Error: {e}")
        return {"status": "error", "message": str(e)}

# --- 9. 静态资源与路径纠错逻辑 (解决 500 错误的关键) ---

# 获取绝对路径
current_app_path = os.path.dirname(os.path.abspath(__file__))

# 智能路径探测：无论是 Docker 内部还是本地 D 盘
frontend_candidates = [
    "/frontend",                                      # Docker 挂载点
    os.path.abspath(os.path.join(current_app_path, "../../frontend")), # 本地相对路径
    os.path.abspath(os.path.join(os.getcwd(), "frontend"))             # 运行上下文路径
]

final_frontend_path = None
for path in frontend_candidates:
    if os.path.exists(path) and os.path.isdir(path):
        final_frontend_path = path
        break

if final_frontend_path:
    logger.info(f"📂 Mounting frontend from: {final_frontend_path}")
    
    # 特别处理 Media 文件夹 (如有)
    media_path = os.path.join(final_frontend_path, "media")
    if os.path.exists(media_path):
        app.mount("/media", StaticFiles(directory=media_path), name="media")

    # 挂载前端根目录
    app.mount("/", StaticFiles(directory=final_frontend_path, html=True), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(final_frontend_path, 'index.html'))
else:
    logger.warning("❌ FATAL: Could not locate frontend directory. Server running in API-only mode.")

@app.get("/health")
def health():
    return {"status": "alive", "gpu_support": "cpu_only_fallback_mode"}