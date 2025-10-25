import serial
import csv
import time
import os
import cv2
import re
from ultralytics import YOLO
# 新增：数据库相关（用于与系统集成）
import sqlite3
from datetime import datetime

# 配置参数（保留你的原有配置）
SERIAL_PORT = '/dev/ttyACM0'
BAUDRATE = 9600
OUTPUT_CSV = 'training_data.csv'
CAMERA_INDEX = 0
COLLECT_INTERVAL = 10  # 采集间隔(秒)
TOTAL_COLLECTIONS = 60480  # 总采集次数（一周数据）
MODEL_PATH = 'yolov8n-pose.pt'
# 新增：数据库路径（与系统统一）
DB_PATH = 'instance/smart_light.db'

model = YOLO(MODEL_PATH)
ser = None
cap = None

# 初始化数据库连接
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# 初始化CSV和数据库表
def init_storage():
    # 初始化CSV（保持原有逻辑）
    if not os.path.exists(OUTPUT_CSV):
        with open(OUTPUT_CSV, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'posture', 'decibel_level', 'ambient_light'])
    
    # 新增：初始化数据库表（用于系统集成）
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            posture TEXT NOT NULL,
            decibel_level REAL,
            ambient_light REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print(f"数据将保存到: {OUTPUT_CSV} 和 {DB_PATH}")

# 姿势检测（保持你的原有逻辑）
def detect_posture():
    # ...（你的原有代码）

# 传感器数据解析（保持你的原有逻辑）
def parse_sensor_line(line):
    # ...（你的原有代码）

# 主函数（增加数据库存储）
def main():
    global ser, cap
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1)
    except Exception as e:
        print(f"无法打开串口 {SERIAL_PORT}: {e}")
        return

    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("无法打开摄像头，请检查连接")
        ser.close()
        return

    init_storage()  # 替换原有的init_csv()
    count = 0
    print(f"开始数据采集，将采集 {TOTAL_COLLECTIONS} 条数据，按 Ctrl+C 停止")

    try:
        while count < TOTAL_COLLECTIONS:
            timestamp = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
            posture = detect_posture()

            # 读取传感器数据（保持原有逻辑）
            try:
                line = ser.readline().decode('utf-8').strip()
            except Exception as e:
                print(f"读取串口失败: {e}")
                time.sleep(1)
                continue

            parsed = parse_sensor_line(line)
            if parsed is None:
                print(f"传感器数据格式错误，跳过: {line}")
                time.sleep(1)
                continue

            decibel_level, ambient_light = parsed

            # 保存数据到CSV（保持原有逻辑）
            try:
                with open(OUTPUT_CSV, 'a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([timestamp, posture, decibel_level, ambient_light])
            except Exception as e:
                print(f"写入 CSV 失败: {e}")

            # 新增：同步保存到数据库（用于前端展示）
            try:
                conn = get_db_connection()
                conn.execute('''
                    INSERT INTO sensor_data 
                    (timestamp, posture, decibel_level, ambient_light)
                    VALUES (?, ?, ?, ?)
                ''', (timestamp, posture, decibel_level, ambient_light))
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"写入数据库失败: {e}")

            count += 1
            print(f"已采集 {count}/{TOTAL_COLLECTIONS} 条数据")
            time.sleep(COLLECT_INTERVAL)

    except KeyboardInterrupt:
        print("\n用户终止采集")
    finally:
        if ser and ser.is_open:
            ser.close()
        if cap and cap.isOpened():
            cap.release()
        print(f"采集结束，共收集 {count} 条数据")

if __name__ == "__main__":
    main()