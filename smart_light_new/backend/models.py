from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# 初始化数据库对象
db = SQLAlchemy()

# 1. 灯光状态表（存储实时亮度、更新时间）
class LightStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    light_id = db.Column(db.Integer, nullable=False, comment="灯光设备ID（1-5）")
    brightness = db.Column(db.Integer, default=0, comment="当前亮度（0-100）")
    updated_at = db.Column(
        db.DateTime, 
        default=datetime.now, 
        onupdate=datetime.now, 
        comment="最后更新时间"
    )

# 2. 检测日志表（存储模型预测结果）
class DetectionLog(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    light_id = db.Column(db.Integer, nullable=False, comment="灯光设备ID（1-5）")
    predicted_on = db.Column(db.Boolean, comment="模型预测是否开灯（True=开）")
    actual_on = db.Column(db.Boolean, comment="实际是否开灯（True=开）")
    suggested_brightness = db.Column(db.Integer, comment="模型建议亮度（0-100）")
    created_at = db.Column(db.DateTime, default=datetime.now, comment="检测时间")