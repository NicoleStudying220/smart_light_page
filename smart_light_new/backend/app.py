from flask import Flask, request, jsonify, send_from_directory
from backend.models import db, DetectionLog, LightStatus
import pandas as pd
from datetime import datetime, timedelta
import os

# 初始化Flask应用
app = Flask(__name__)

# 配置数据库（自动生成到instance文件夹）
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/smart_light.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db.init_app(app)

# 首次运行自动创建数据库表
with app.app_context():
    db.create_all()

# ------------------- API接口 -------------------
# 1. 获取最近24小时检测结果
@app.route('/api/detection-results', methods=['GET'])
def get_detection_results():
    try:
        light_id = request.args.get('light_id', 1, type=int)  # 默认查1号灯
        yesterday = datetime.now() - timedelta(days=1)
        results = DetectionLog.query.filter(
            DetectionLog.light_id == light_id,
            DetectionLog.created_at >= yesterday
        ).all()
        return jsonify([{
            "time": item.created_at.strftime("%H:%M"),
            "predicted_on": item.predicted_on,
            "actual_on": item.actual_on,
            "suggested_brightness": item.suggested_brightness
        } for item in results])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. 获取亮度趋势（按天统计）
@app.route('/api/brightness-trend', methods=['GET'])
def get_brightness_trend():
    try:
        trend_data = db.session.query(
            db.func.date(LightStatus.updated_at).label('date'),
            db.func.avg(LightStatus.brightness).label('avg_brightness')
        ).group_by('date').order_by('date').all()
        return jsonify([{
            "date": str(item.date),
            "avg_brightness": round(item.avg_brightness, 1) if item.avg_brightness else 0
        } for item in trend_data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. 手动触发模型检测
@app.route('/api/run-detection', methods=['POST'])
def trigger_detection():
    try:
        from backend.model4 import run_detection
        run_detection()
        return jsonify({"status": "检测完成"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------- 静态文件路由（关键修复！） -------------------
# 首页
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# 其他静态文件（CSS/JS/图片）
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

# 启动服务（树莓派局域网可访问）
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)