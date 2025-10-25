# backend/model_api.py
from flask import Flask, jsonify, request
from flask_cors import CORS  # 解决跨域问题
import your_model  # 替换为你的模型文件（如model4.py）

app = Flask(__name__)
CORS(app)  # 允许所有域名跨域请求

# 加载模型（仅在启动时加载一次）
model = your_model.load_model()  # 替换为你的模型加载函数

@app.route('/api/predict_rule', methods=['POST'])
def predict_rule():
    # 接收前端传递的参数（如传感器数据）
    data = request.json
    # 调用模型预测规则
    predicted_rule = model.predict(data)  # 替换为你的模型预测逻辑
    # 返回JSON结果
    return jsonify({
        "status": "success",
        "rule": predicted_rule
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)