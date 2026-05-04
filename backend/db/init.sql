-- -----------------------------------------------------
-- SagoCraft AI - 数据库初始化脚本
-- -----------------------------------------------------

-- 1. 如果数据库不存在，则创建它，并设置为当前使用
CREATE DATABASE IF NOT EXISTS sago_db;
USE sago_db;

-- 2. 创建核心数据表 (detection_logs)
-- 这个表的结构与我们 main.py 里的 DetectionLog 模型完全匹配
CREATE TABLE IF NOT EXISTS detection_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action_recognized VARCHAR(100) NOT NULL,
    detected_objects TEXT,
    quality_probability FLOAT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. (可选) 插入一条测试数据，方便你第一次连接时确认表已成功创建
INSERT INTO detection_logs (action_recognized, detected_objects, quality_probability) 
VALUES ('System_Initialization', 'Database and table created successfully', 1.0);

-- 4. 刷新权限，确保后端服务可以正常读写
FLUSH PRIVILEGES;