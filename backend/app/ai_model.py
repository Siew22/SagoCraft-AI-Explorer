# backend/app/ai_model.py

import torch
import torch.nn as nn
import torchvision.models as models

class SagoActionModel(nn.Module):
    def __init__(self, num_classes=2, hidden_size=256):
        super(SagoActionModel, self).__init__()
        
        # 1. 空间特征提取器: 使用轻量级 MobileNetV2
        mobilenet = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        # 去掉最后的分类层，我们只要它提取特征的部分
        self.features = mobilenet.features 
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        
        # 2. 时间特征提取器: LSTM (MobileNet输出特征是 1280 维)
        self.lstm = nn.LSTM(input_size=1280, hidden_size=hidden_size, 
                            num_layers=1, batch_first=True, bidirectional=True)
        
        # 3. 注意力机制 (XAI 的核心，看它关注哪一秒)
        self.attention = nn.Sequential(
            nn.Linear(hidden_size * 2, 64),
            nn.Tanh(),
            nn.Linear(64, 1),
            nn.Softmax(dim=1)
        )
        
        # 4. 最终分类器
        self.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(hidden_size * 2, num_classes)
        )

    def forward(self, x):
        # x 的形状: (批次大小 Batch, 视频帧数 Frames, 通道 C, 高 H, 宽 W)
        batch_size, seq_len, c, h, w = x.size()
        
        # 把 batch 和 frames 融合，一次性送入 CNN 提速
        x = x.view(batch_size * seq_len, c, h, w)
        cnn_out = self.features(x)
        cnn_out = self.pool(cnn_out)
        
        # 恢复出时间维度
        cnn_out = cnn_out.view(batch_size, seq_len, -1) 
        
        # 送入 LSTM 理解动作顺序
        lstm_out, _ = self.lstm(cnn_out)
        
        # 计算注意力权重 (那一帧最重要？)
        attn_weights = self.attention(lstm_out)
        
        # 把重要帧的特征加权融合
        context = torch.sum(attn_weights * lstm_out, dim=1)
        
        # 得出最终动作分类
        output = self.classifier(context)
        
        # 返回预测结果 和 注意力权重(给前端画图用)
        return output, attn_weights.squeeze(-1)