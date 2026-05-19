# RebornG v1.1.0 Codex 当前入口

日期：2026-05-19
状态：草案；等待用户审阅与范围冻结
主题：`路线、地点与区域状态地基`

## 定位

`v1.1.0` 是 v1.x 阶段的第一块地基。

`v1.0.0` 已经完成“青茅到南疆早期连续体验”的候选验收，但它刻意没有新增正式 route/location/currentRegion 持久字段。`v1.1.0` 的任务是把这件事推到设计门禁和小范围正式化：

> 世界开始正式承认玩家在哪里、从哪里来、走在什么路线、面对什么区域压力。

## 已获用户批准

- v1.1 主线选择 A：正式路线/地点/区域承接地基。
- 允许专家团在设计门禁中严肃评估 `SAVE_FORMAT_VERSION = 23`。

## 尚未自动批准

以下事项仍必须停下来让用户决策：

- 实际提升 `SAVE_FORMAT_VERSION`。
- 新增正式 route/location/currentRegion 或等价持久字段。
- 正式进入南疆地点、商家城、阵营、奖励、NPC 生死。
- 扩大 DeepSeek 权限。
- 公开发布承诺、自动部署、后端/BFF。

## 当前权威文件

- `v1.1.0-总体开发大纲.md`
- `v1.1.0-启动审查与范围冻结.md`
- `v1.1.0-小版本执行路线图.md`
- `v1.1.0-需求决策池.md`
- `v1.1.0-真相源索引.md`
- `v1.1.0-测试矩阵.md`
- `v1.1.0-MiroFish资料需求与交付协议.md`
- `v1.1.0-Git提交与推送计划.md`
- `v1.1.0-专家团启动会纪要.md`

长期参考：

- `指导大纲/长期路线/RebornG-v1.1至v2.0长期路线重整草案.md`
- `指导大纲/长期路线/RebornG-外部活世界参考映射.md`

MiroFish intake：

- `指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-19-v110-three-pack-intake-review-summary.md`

## 推荐小版本

| 阶段 | 主题 | 是否 runtime | MiroFish need |
|---|---|---:|---|
| a0 | 长期路线重整与 v1.1 启动审查 | 否 | preferred |
| a1 | route/location/save-format 设计门禁 | 否 | preferred |
| a2 | MiroFish intake、字段表、旧档迁移矩阵 | 否 | 三包已交付并通过 intake 第一轮；runtime absorption 仍需 a1/a2 |
| b1 | 正式路线状态第一刀 | 是，需另行批准字段方案 | blocking |
| b2 | 区域状态与玩家可读位置面板 | 是 | preferred |
| b3 | 前期账本 -> 路线/区域压力回流 | 是 | preferred |
| b4 | 南疆早期外缘行动承接 | 是 | preferred |
| process-1 | 旧档迁移、回滚、生产预览专项 | 否或脚本 | not_needed |
| rc | v1.1 质量收束 | 是 | 按 runtime 吸收范围判定 |

## 当前结论

专家团建议先完成 a0/a1/a2 文档与设计门禁，再决定是否进入 b1 runtime 字段实现。这样不会在没有旧档迁移和权威表的情况下贸然写入 route/location，也不会把完整南疆或完整商家城误塞进 v1.1。
