# RebornG v2.0.0 Codex 当前入口

状态：a1 approved；D-200/D-201 已全批准，等待进入 b1 runtime 第一刀。
日期：2026-05-22
主题候选：第一个区域活世界入场门禁

## 当前一句话

`v2.0.0` 不应该从“再加一个 projection tab”开始，而应该从第一个可长测、可回滚、可解释的区域活世界开始。

专家团建议主线：

`第一个区域活世界：南疆早期低阶外缘小区域`

当前已完成 v2.0 专家团启动会和 a1 设计门禁。用户已批准 v2.0 主线、第一核心区域、v25 + 最小 `regionalEventLedger` 的有条件 runtime 授权、T3 320 轮硬门和继续禁止 RAG/BFF/子代理/formal outcome 等边界。

当前仍未改 runtime，未 bump save-format，未新增 DeepSeek 权限，未新增后端，未启用子代理。

## 当前入口文件

- `v2.0.0-专家团启动会纪要.md`
- `v2.0.0-启动审查与范围冻结.md`
- `v2.0.0-总体开发大纲.md`
- `v2.0.0-小版本执行路线图.md`
- `v2.0.0-需求决策池.md`
- `v2.0.0-a0-治理补丁与范围冻结.md`
- `v2.0.0-a1-第一核心区域与save-format设计门禁.md`
- `v2.0.0-真相源索引.md`
- `v2.0.0-测试矩阵.md`
- `v2.0.0-MiroFish资料需求与交付协议.md`
- `v2.0.0-Git提交与推送计划.md`

## 必读制度

- `指导大纲/流程制度/Git分支切换与推送制度.md`
- `指导大纲/流程制度/Skill同步审计制度.md`
- `指导大纲/流程制度/MiroFish双仓topic-slice流水线制度.md`
- `指导大纲/流程制度/长线叙事漂移测试制度.md`
- `指导大纲/流程制度/测试矩阵演进规则.md`
- `指导大纲/流程制度/全书知识库治理制度.md`
- `指导大纲/流程制度/Player-Advocate走查制度.md`

## v1.9 继承输入

v1.9 已完成：

- v2 readiness report。
- 区域事件 envelope。
- 同开局长期差异与 `runFingerprint` 评估。
- T3 300+ mixed/live/replay 长测计划。
- P2 正式凭证词/英文术语 hardening。
- 只读/分析型子代理评估。
- MiroFish topic `southern_border_low_rank_region_life_v2_prelude_slice` intake。

v1.9 没有批准，但 v2.0-a1 已重新决策并批准：

- `SAVE_FORMAT_VERSION = 25`。
- `regionalEventLedger`。

v2.0-a1 继续暂缓：

- `runFingerprint`。
- `regionalLifeState` / `areaLivingState`。
- `identityRouteState` / `professionState`。
- DeepSeek visible knowledge / RAG。
- BFF/backend。
- 子代理。
- 正式地点、阵营、奖励、NPC 生死或 canon promotion。

## 当前硬边界

- 不自动进入 v2.0 runtime。
- 不自动新增持久字段。
- 不自动把 MiroFish 或知识库内容喂给 DeepSeek。
- 不开放完整南疆、完整商家城、正式商队/散修/城市身份。
- 不结算正式价格、库存、工资、奖励、战斗掉落、NPC 生死。
- 不部署 EdgeOne。

## 当前批准结论

- D-200-001 至 D-200-008：已全部批准。
- D-201-001 至 D-201-012：已全部批准。
- v2.0 第一核心区域正式批准为 `南疆早期低阶外缘小区域`。
- b1 可进入 `SAVE_FORMAT_VERSION = 25` + 单一最小 `regionalEventLedger` runtime 第一刀。
- b1 必须同一刀完成 migration/defaults/tests/rollback。
- `runFingerprint`、正式区域状态、正式身份状态继续暂缓。
- v2.0 rc 前 T3 320 total rounds，live 不低于 160 轮。

## 下一步

建议下一刀进入：

`v2.0.0-b1-regionalEventLedger与WorldCore第一刀`
