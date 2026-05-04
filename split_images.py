# split_images.py

import os
import random
import shutil

def split_files(source_folder, dest_folder, file_extensions, split_ratio=0.7):
    print(f"🚀 开始自动分割 {source_folder}...")
    # ... (代码逻辑与 split_videos.py 完全相同，为简洁此处省略)
    # 请将 split_videos.py 的代码完整复制到这里
    train_path = os.path.join(dest_folder, 'train')
    val_path = os.path.join(dest_folder, 'val')
    
    os.makedirs(train_path, exist_ok=True)
    os.makedirs(val_path, exist_ok=True)
    
    for class_name in os.listdir(source_folder):
        class_source_path = os.path.join(source_folder, class_name)
        if not os.path.isdir(class_source_path): continue

        print(f"  - 正在处理类别: {class_name}")
        os.makedirs(os.path.join(train_path, class_name), exist_ok=True)
        os.makedirs(os.path.join(val_path, class_name), exist_ok=True)
        
        all_files = [f for f in os.listdir(class_source_path) if f.lower().endswith(file_extensions)]
        random.shuffle(all_files)
        
        split_point = int(len(all_files) * split_ratio)
        train_files = all_files[:split_point]
        val_files = all_files[split_point:]
        
        for file in train_files:
            shutil.copy(os.path.join(class_source_path, file), os.path.join(train_path, class_name, file))
        for file in val_files:
            shutil.copy(os.path.join(class_source_path, file), os.path.join(val_path, class_name, file))
            
        print(f"    '{class_name}' 分割完成: {len(train_files)} 训练, {len(val_files)} 验证。")

if __name__ == "__main__":
    # --- 分割图片 ---
    image_source = "raw_data/images"
    image_dest = "dataset/images"
    image_ext = ('.jpg', '.jpeg', '.png')

    if os.path.exists(image_source):
        split_files(image_source, image_dest, image_ext)
        print("\n✅ 图片数据集分割完毕！")
    else:
        print(f"⚠️ 警告: 图片源文件夹 '{image_source}' 不存在，跳过图片分割。")