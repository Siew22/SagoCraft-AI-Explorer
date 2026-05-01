import cv2
import torch
from ultralytics import YOLO
from deepface import DeepFace

# --- 核心修改：加载你训练的 best.pt (已重命名为 sago_yolo.pt) ---
print("🚀 正在加载你亲自训练的 Sago 大脑...")
yolo_model = YOLO('app/sago_yolo.pt') # 路径必须对
print("✅ 加载成功！")

def analyze_single_frame(frame_np):
    detected_objects = []
    
    # 1. 运行你的专属 YOLO 识别
    results = yolo_model(frame_np, verbose=False)
    
    for box in results[0].boxes:
        class_id = int(box.cls[0])
        # 这里会自动变成你在 Roboflow 写的：Nyiru, Belanga, human 等
        class_name = yolo_model.names[class_id] 
        confidence = float(box.conf[0])
        
        if confidence > 0.4: # 置信度阈值
            x1, y1, x2, y2 = [int(i) for i in box.xyxy[0]]
            
            obj_data = {
                "object_name": class_name,
                "confidence": round(confidence, 2),
                "bounding_box": [x1, y1, x2, y2],
                "attributes": {}
            }
            
            # 2. 性别识别：如果 YOLO 认出是 'human'
            if class_name.lower() == 'human':
                try:
                    person_crop = frame_np[y1:y2, x1:x2]
                    person_crop_rgb = cv2.cvtColor(person_crop, cv2.COLOR_BGR2RGB)
                    # enforce_detection=False 是为了戴头巾或低头时也能跑
                    analysis = DeepFace.analyze(person_crop_rgb, actions=['gender'], enforce_detection=False)
                    gender = analysis[0]['dominant_gender'] if isinstance(analysis, list) else analysis['dominant_gender']
                    obj_data["attributes"]["gender"] = "Female (Mak Cik)" if gender == "Woman" else "Male (Pak Cik)"
                except:
                    obj_data["attributes"]["gender"] = "Unknown"

            detected_objects.append(obj_data)

    return {
        "detected_objects": detected_objects,
        "scene_caption": f"Recognized {len(detected_objects)} sago elements."
    }