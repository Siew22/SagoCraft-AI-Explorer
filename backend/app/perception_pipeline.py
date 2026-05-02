# backend/app/perception_pipeline.py
import cv2
import torch
import numpy as np
from ultralytics import YOLO
from deepface import DeepFace

# 加载模型
print("🚀 正在点亮 Sago 智能大脑...")
yolo_model = YOLO('app/sago_yolo.pt') 

def analyze_single_frame(frame_np, track=True):
    detected_objects = []
    
    # 增加 device='cpu' 确保稳定性，开启追踪
    results = yolo_model.track(frame_np, persist=track, verbose=False, device='cpu')
    
    boxes = results[0].boxes
    if boxes is not None and len(boxes) > 0:
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            name = yolo_model.names[cls_id]
            
            # --- 核心逻辑过滤 ---
            
            # 1. 打印后台调试信息（你可以通过看命令行知道它为什么认错）
            print(f"DEBUG: 检测到 [{name}] 置信度: {conf:.2f}")

            # 2. 设置极高的 Nyiru 门槛
            # 因为你现在不在工厂，房间里不可能有 Nyiru，所以我们把门槛拉到 0.85
            min_conf = 0.85 if name == 'Nyiru' else 0.5
            
            if conf > min_conf:
                coords = box.xyxy[0].cpu().numpy().astype(int).tolist()
                
                # 3. 几何形状过滤 (Nyiru 应该是扁的或方的)
                width = coords[2] - coords[0]
                height = coords[3] - coords[1]
                aspect_ratio = width / height
                
                # 如果认成 Nyiru 但它是长条形的（像人头），那就过滤掉
                if name == 'Nyiru' and aspect_ratio < 0.8:
                    continue

                obj_id = int(box.id[0]) if box.id is not None else None
                
                obj_data = {
                    "object_id": obj_id,
                    "object_name": name,
                    "confidence": round(conf, 2),
                    "bounding_box": coords,
                    "attributes": {}
                }

                # 性别识别逻辑
                if name.lower() == 'human':
                    try:
                        # 稍微扩大一点裁剪区域
                        h, w, _ = frame_np.shape
                        y1, y2 = max(0, coords[1]), min(h, coords[3])
                        x1, x2 = max(0, coords[0]), min(w, coords[2])
                        person_crop = frame_np[y1:y2, x1:x2]
                        
                        analysis = DeepFace.analyze(person_crop, actions=['gender'], enforce_detection=False)
                        gender = analysis[0]['dominant_gender'] if isinstance(analysis, list) else analysis['dominant_gender']
                        obj_data["attributes"]["gender"] = "Female (Mak Cik)" if gender == "Woman" else "Male (Pak Cik)"
                    except:
                        obj_data["attributes"]["gender"] = "Unknown"

                detected_objects.append(obj_data)

    # 4. 冲突解决：如果在同一个位置识别到了两个东西，去掉 Nyiru
    # (这能防止 AI 把人脸叠加上一个 Nyiru 框)
    if len(detected_objects) > 1:
        has_human = any(o['object_name'] == 'human' for o in detected_objects)
        if has_human:
            # 如果有人在，就把置信度不高的 Nyiru 过滤掉
            detected_objects = [o for o in detected_objects if not (o['object_name'] == 'Nyiru' and o['confidence'] < 0.9)]

    return {
        "detected_objects": detected_objects,
        "scene_caption": "Sago AI Monitoring"
    }
