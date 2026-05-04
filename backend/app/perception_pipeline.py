# backend/app/perception_pipeline.py
import cv2
import torch
import numpy as np
from ultralytics import YOLO
# ⚠️ 屏蔽掉 DeepFace，防止它去网上下载坏掉的文件
# from deepface import DeepFace

print("🚀 正在点亮 Sago 智能大脑...")
yolo_model = YOLO('app/sago_yolo.pt') 

def analyze_single_frame(frame_np, track=True):
    detected_objects =[]
    
    results = yolo_model.track(frame_np, persist=track, verbose=False, device='cpu')
    
    boxes = results[0].boxes
    if boxes is not None and len(boxes) > 0:
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            name = yolo_model.names[cls_id]
            
            print(f"DEBUG: 检测到 [{name}] 置信度: {conf:.2f}")

            min_conf = 0.85 if name == 'Nyiru' else 0.5
            
            if conf > min_conf:
                coords = box.xyxy[0].cpu().numpy().astype(int).tolist()
                
                width = coords[2] - coords[0]
                height = coords[3] - coords[1]
                aspect_ratio = width / height
                
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

                # ⚠️ 屏蔽性别识别，直接给个人类标签
                if name.lower() == 'human':
                    obj_data["attributes"]["gender"] = "Worker"

                detected_objects.append(obj_data)

    if len(detected_objects) > 1:
        has_human = any(o['object_name'] == 'human' for o in detected_objects)
        if has_human:
            detected_objects = [o for o in detected_objects if not (o['object_name'] == 'Nyiru' and o['confidence'] < 0.9)]

    return {
        "detected_objects": detected_objects,
        "scene_caption": "Sago AI Monitoring"
    }