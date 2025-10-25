import time
import re
import csv
import os
import json
from datetime import datetime
import serial
import cv2
from ultralytics import YOLO
# 新增：数据库支持（与系统统一存储）
import sqlite3

# 配置参数（与项目结构对齐）
SERIAL_PORT = '/dev/ttyACM0'
BAUDRATE = 9600
CAMERA_INDEX = 0
DETECTION_INTERVAL = 60  # 检测间隔（秒）
CSV_LOG_FILE = 'detection_log.csv'
# 新增：系统数据库路径（与web端共享数据）
DB_PATH = 'instance/smart_light.db'
# 新增：规则历史记录文件
RULE_HISTORY_FILE = 'rule_history.json'

# 初始化YOLO模型
model = YOLO('yolov8n-pose.pt')

# 初始化摄像头
cap = cv2.VideoCapture(CAMERA_INDEX)
if not cap.isOpened():
    raise Exception("无法打开摄像头，请检查连接")


def init_storage():
    """初始化CSV和数据库存储"""
    # 初始化CSV
    if not os.path.exists(CSV_LOG_FILE):
        with open(CSV_LOG_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'timestamp', 'posture', 'decibel_level', 'ambient_light', 'control_command'
            ])
    
    # 初始化数据库
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS control_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            posture TEXT NOT NULL,
            decibel_level REAL,
            ambient_light REAL,
            control_command TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    
    # 初始化规则历史文件
    if not os.path.exists(RULE_HISTORY_FILE):
        with open(RULE_HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
    
    print(f"数据将保存到: {CSV_LOG_FILE} 和 {DB_PATH}")


def detect_posture():
    ret, frame = cap.read()
    if not ret:
        return "unknown"
    
    results = model(frame, classes=0, conf=0.5)
    
    if results and len(results[0].keypoints) > 0:
        keypoints = results[0].keypoints.xy[0].tolist()
        if len(keypoints) >= 15:
            nose_y = keypoints[0][1]
            left_hip_y = keypoints[11][1]
            right_hip_y = keypoints[12][1]
            left_knee_y = keypoints[13][1]
            right_knee_y = keypoints[14][1]
            
            hip_avg = (left_hip_y + right_hip_y) / 2
            knee_avg = (left_knee_y + right_knee_y) / 2
            
            if knee_avg > hip_avg + 50:
                return "standing"
            elif hip_avg > nose_y + 100:
                return "sitting"
            else:
                return "lying"
    
    return "unknown"


def read_sensors(ser):
    try:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if not line:
            print("未收到传感器数据，重试...")
            return None, None
        
        parts = line.split(',')
        if len(parts) >= 2:
            try:
                decibel_level = float(parts[0].strip())
                ambient_light = float(parts[1].strip())
                return decibel_level, ambient_light
            except ValueError:
                pass
        
        matches = re.findall(r'[-+]?\d*\.\d+|\d+', line)
        if len(matches) >= 2:
            try:
                decibel_level = float(matches[0])
                ambient_light = float(matches[1])
                return decibel_level, ambient_light
            except ValueError:
                print(f"数据转换失败：{matches}")
                return None, None
        else:
            print(f"无法提取有效数据：{line}")
            return None, None
    except Exception as e:
        print(f"读取传感器出错：{e}")
        return None, None


def load_rules():
    """加载当前生效的规则（支持用户自定义）"""
    # 优先从本地存储读取用户设置的规则
    if os.path.exists('custom_rules.json'):
        with open('custom_rules.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    
    # 默认规则
    return {
        "light_threshold": 300,
        "noise_threshold": 30,
        "night_mode_start": "22:00",
        "night_mode_end": "06:00",
        "night_brightness": 30
    }


def log_rule_change(description):
    """记录规则变更历史（用于页面展示）"""
    with open(RULE_HISTORY_FILE, 'r', encoding='utf-8') as f:
        history = json.load(f)
    
    history.append({
        "id": len(history) + 1,
        "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "action": "更新",
        "description": description,
        "status": "生效"
    })
    
    with open(RULE_HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def decide_action(posture, decibel_level, ambient_light):
    """智能决策逻辑（支持规则更新）"""
    rules = load_rules()
    current_time = datetime.now().strftime('%H:%M')
    
    # 判断是否处于夜间模式
    is_night_mode = (current_time >= rules["night_mode_start"] or 
                   current_time <= rules["night_mode_end"])
    
    # 核心决策逻辑
    if ambient_light < rules["light_threshold"]:
        if posture != 'lying' or decibel_level > rules["noise_threshold"]:
            if is_night_mode:
                return f'开灯(亮度:{rules["night_brightness"]}%)'
            return '开灯'
        else:
            return '关灯'
    else:
        return '关灯'


def main():
    init_storage()
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1)
    except Exception as e:
        print(f"无法打开串口 {SERIAL_PORT}：{e}")
        return
    
    print("开始实时检测，按Ctrl+C退出")
    
    try:
        while True:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # 读取传感器数据
            retry = 3
            decibel_level, ambient_light = None, None
            while retry > 0:
                decibel_level, ambient_light = read_sensors(ser)
                if decibel_level is not None and ambient_light is not None:
                    break
                retry -= 1
                time.sleep(0.5)
            if decibel_level is None or ambient_light is None:
                print("多次重试后仍无有效数据，跳过本轮")
                time.sleep(DETECTION_INTERVAL)
                continue
            
            posture = detect_posture()
            command = decide_action(posture, decibel_level, ambient_light)
            
            print(f"[{timestamp}] 姿势：{posture}，声级：{decibel_level}，光照：{ambient_light}，控制指令：{command}")
            
            # 写入控制指令（供前端读取）
            with open('control_command.txt', 'w', encoding='utf-8') as f:
                f.write(command + '\n')
            
            # 保存到CSV
            with open(CSV_LOG_FILE, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    timestamp, posture, decibel_level, ambient_light, command
                ])
            
            # 保存到数据库（供web页面展示）
            conn = sqlite3.connect(DB_PATH)
            conn.execute('''
                INSERT INTO control_logs 
                (timestamp, posture, decibel_level, ambient_light, control_command)
                VALUES (?, ?, ?, ?, ?)
            ''', (timestamp, posture, decibel_level, ambient_light, command))
            conn.commit()
            conn.close()
            
            time.sleep(DETECTION_INTERVAL)
    
    except KeyboardInterrupt:
        print("\n用户终止检测")
    finally:
        ser.close()
        cap.release()
        cv2.destroyAllWindows()
        print(f"检测结束，数据已保存到 {CSV_LOG_FILE}")


if __name__ == "__main__":
    main()

