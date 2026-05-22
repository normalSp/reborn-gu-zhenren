# RebornG v2.1.0 Codex 当前入口

状态：active planning；Agent Simulation Lab 启动版。
日期：2026-05-22
当前分支：`codex/v210-a0-agent-lab-startup`

## 当前一句话

`v2.1.0` 不继续往 v2.0 堆 runtime，而是先把 Agent Simulation Lab、Claude Code 架构尽调、WorldCore/Agent 权限边界和 eval farm 设计成可审计的工程入口。

本批只做文档、启动会、复盘和设计门禁：

- 不改 runtime。
- 不新增 save 字段，不 bump `SAVE_FORMAT_VERSION`。
- 不新增 DeepSeek prompt/context/model/authority。
- 不新增后端/BFF。
- 不调用 live DeepSeek。
- 不启用子代理。
- 不新增 MiroFish export。
- 不开放正式地点、阵营、奖励、NPC 生死或 canon promotion。

## 当前入口文件

- `v2.1.0-专家团启动会纪要.md`
- `v2.1.0-启动审查与范围冻结.md`
- `v2.1.0-总体开发大纲.md`
- `v2.1.0-小版本执行路线图.md`
- `v2.1.0-需求决策池.md`
- `v2.1.0-a0-v2.0-T3复盘与Agent-Lab范围冻结.md`
- `v2.1.0-a1-Claude-Code架构尽调.md`
- `v2.1.0-a2-Agent-Lab设计门禁草案.md`
- `v2.1.0-a0-Skill同步审计记录.md`
- `v2.1.0-真相源索引.md`
- `v2.1.0-测试矩阵.md`
- `v2.1.0-MiroFish资料需求与交付协议.md`
- `v2.1.0-Git提交与推送计划.md`

## v2.0 继承输入

v2.0 已完成：

- `SAVE_FORMAT_VERSION = 25`。
- 单一最小 `regionalEventLedger`。
- `EventEnvelope -> WorldCore -> regionalEventLedger -> replay lane report -> readiness review -> DeepSeek narrative`。
- T3 deterministic/replay 160/160 accepted，P0/P1/P2=0/0/0。
- T3 live clean3 160/160 accepted，P0/P1/P2=0/0/0。
- mixed total 320/320 accepted，live cost `$0.03083156`。

v2.0 没有批准：

- `runFingerprint`。
- `regionalLifeState` / `areaLivingState`。
- `identityRouteState` / `professionState`。
- DeepSeek visible knowledge / RAG。
- BFF/backend。
- 子代理。
- 正式地点、阵营、奖励、NPC 生死或 canon promotion。

## v2.1 主线

用户已选择：

- v2.1 主线：`Agent Lab`。
- Claude Code 处理方式：`专项尽调`。

推荐 v2.1 第一批顺序：

1. a0：v2.0 T3 复盘与 Agent Lab 范围冻结。
2. a1：Claude Code 架构尽调。
3. a2：Agent Lab 设计门禁草案。
4. b1 是否进入 report-only/offline runner，由 a2 后用户单独拍板。

## 必读制度

- `指导大纲/流程制度/Git分支切换与推送制度.md`
- `指导大纲/流程制度/Skill同步审计制度.md`
- `指导大纲/流程制度/长线叙事漂移测试制度.md`
- `指导大纲/流程制度/测试矩阵演进规则.md`
- `指导大纲/流程制度/全书知识库治理制度.md`
- `指导大纲/流程制度/MiroFish双仓topic-slice流水线制度.md`

## 下一步

建议进入：

`v2.1.0-a0-v2.0-T3复盘与Agent-Lab范围冻结`
