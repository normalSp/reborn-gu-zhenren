# MiroFish Request: v110_travel_supply_pursuit_identity_pressure_pack

日期：2026-05-19
请求方：RebornG Expert Council
目标版本：v1.1.0
优先级：preferred before b3

## 目的

请为 RebornG v1.1 提供“旅行补给、追踪压力、身份风险”候选资料包。

本包用于支持 v1.1 b3：把 v1.0/v0.18 的前期账本回流到路线/区域压力。

## 范围

重点关注：

- 低阶蛊师离开原区域后的补给压力。
- 被追踪、被盘问、身份暴露、路引/伪装/接触窗口的风险。
- 商队、散修、家族余波、山路危险对玩家的公开压力。
- 能转化为测试样本的极端/边界情况。

## 输出要求

每项建议包含：

- `itemId`
- `pressureType`: supply / pursuit / identity / faction / route / mixed
- `visibility`
- `summary`
- `sourcePointers`
- `triggerHints`
- `failureOrCostHints`
- `riskTags`
- `recommendedRebornGUse`

## 禁止

- 不要包含原文正文或长引用。
- 不要输出正式追杀成功/失败、NPC 生死、阵营转移、奖励。
- 不要让玩家直接获得高阶机缘、仙蛊、尊者传承。
- 不要把候选材料写成 RebornG runtime truth。

## 交付后 RebornG 的处理方式

RebornG 会先写 intake review，再将合格项改写为规则草稿或测试样本。隐藏事实只可作为 hidden ref，不进入 UI 或 DeepSeek visible context。
