# backend/app/bayesian.py

from pgmpy.models import BayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination

# --- 1. 建立贝叶斯网络模型 ---
def setup_bayesian_model():
    model = BayesianNetwork([('Action', 'Quality')])
    cpd_action = TabularCPD(variable='Action', variable_card=2, values=[[0.5], [0.5]])
    cpd_quality = TabularCPD(variable='Quality', variable_card=2, 
                             values=[[0.8, 0.1], [0.2, 0.9]],
                             evidence=['Action'], evidence_card=[2])
    model.add_cpds(cpd_action, cpd_quality)
    return VariableElimination(model)

# 初始化推理引擎
infer_engine = setup_bayesian_model()

# --- 2. 桥梁函数：根据 YOLO 识别到的物体推断动作 ---
# 注意：这里不需要 import 任何 app.bayesian 的东西！
def get_action_from_detections(objects_list):
    # 提取所有认出来的东西的名字 (转小写)
    names = [obj['object_name'].lower() for obj in objects_list]
    
    # 逻辑推断
    if 'human' in names and 'nyiru' in names:
        return "Sifting Sago", True # (动作名, 是否属于标准核心工艺)
    elif 'human' in names and 'belanga' in names:
        return "Roasting Sago", True
    elif 'sagu' in names:
        return "Packaging", False
    else:
        return "Idle / Observing", False

# --- 3. 计算质量概率 ---
def get_quality_probability(is_standard_action):
    evidence_val = 1 if is_standard_action else 0
    res = infer_engine.query(variables=['Quality'], evidence={'Action': evidence_val})
    return round(float(res.values[1]), 4)