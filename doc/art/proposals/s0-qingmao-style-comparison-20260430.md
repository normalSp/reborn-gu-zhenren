# 美术风格对比报告 2026-04-30

## 测试图生成信息

| 图 | 文件名 | prompt |
|----|--------|--------|
| 人物 | `gu-yue-qing-shu-test.png` | 古月青书全身立绘, dark xianxia, muted sage gray/old paper tan/dark copper |
| 场景 | `qingmao-mountain-gate-test.png` | 青茅山寨山门晨雾, grey-green mist, low texture density, wet moss |
| 战斗 | `earthwolf-spider-pursuit-test.png` | 地狼蛛侧卷追杀, cinematic broad value masses, continuous rim light, S-curve |

## 风格对比

### 色调一致性

| 维度 | 现有66张 | 3张新图 | 差异 |
|------|---------|--------|------|
| 整体饱和度 | 低饱和，偏青灰/暗铜 | 低饱和（基调一致） | 待视觉验收 |
| 主色调 | 青灰+旧纸+暗铜+朱砂点缀 | prompt约束同 | 待视觉验收 |
| 冷雾/环境光 | 灰绿冷雾为主 | grey-green cold mist指定 | 待视觉验收 |

### 纹理/笔触

| 维度 | 现有66张 | 3张新图 | 差异 |
|------|---------|--------|------|
| 纹理密度 | low texture density | 相同要求 | 待视觉验收 |
| 暗部处理 | grouped dark shapes, 地面成大面 | cinematic broad value masses | 待视觉验收 |
| 噪点/砂砾 | 禁止点状高光/砂砾噪声 | explicit avoidance in prompt | 待视觉验收 |
| 边缘光 | continuous rim light bands | 相同 | 待视觉验收 |

### 人物细节

| 维度 | 现有66张（方源/白凝冰等） | 新图（古月青书） | 差异 |
|------|-------------------------|----------------|------|
| 面部特征 | 五官略有不对称，表情克制 | no perfect idol face, restrained expression | 待视觉验收 |
| 服装 | 厚重朴素，有磨损感 | worn layered robes, frayed edges | 待视觉验收 |
| 光源 | 硬边明暗分组 | hard-edge chiaroscuro | 待视觉验收 |

### 预期差异

AI图像生成工具天然存在模型差异。预期差异点：
- 人脸风格（不同模型训练数据不同）
- 笔触质感（有无干笔/厚涂效果）
- 色彩细微差异（prompt描述可调控但无法完全一致）

### 结论

风格母版已建立（prompt工程），色调/纹理/构图参数均可标准化。最终风格一致性需人工视觉验收——直接对比PNG文件。

## 后续建议

如差异大：采用人工调色/合成工具微调。
如差异小：可批量生成，每次1张按「Single Image Cadence」策略。
