# verify_vision.py
import cv2
import torch
from ultralytics import YOLO
import os

# 1. 加载你刚练成的模型
model = YOLO('backend/app/sago_yolo.pt') 

# 2. 选择一张你要测试的照片路径 (选一张带阿姨或带炉子的)
# 你可以换成你 dataset/test 里的任何一张图
test_image_path = r"C:\Users\Student\AppData\Local\Programs\Python\Python310\Sago_CNNs\Sago_Final_Dataset.v1-finally-ah-dataset.yolov8\test\images\你的某张图片名.jpg"

if not os.path.exists(test_image_path):
    print("❌ 找不到图片，请修改代码里的 test_image_path 路径！")
else:
    # 3. 运行推理
    results = model(test_image_path)

    # 4. 自动画框并保存结果
    # results[0].plot() 会返回一个带框的 BGR 图像
    annotated_frame = results[0].plot()

    # 保存到当前文件夹
    output_path = "test_result.jpg"
    cv2.imwrite(output_path, annotated_frame)

    print(f"✅ 验证完成！请在文件夹里打开: {output_path} 查看效果图！")
    
    # 展示识别到了什么
    for box in results[0].boxes:
        name = model.names[int(box.cls[0])]
        conf = float(box.conf[0])
        print(f"检测到: {name} (置信度: {conf:.2f})")