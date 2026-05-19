# RebornG v0.19.0 Codex 当前入口

日期：2026-05-19
状态：本地开发里程碑已完成，等待 commit/push/远端 CI 证据补录
主题：`内容生产、长测与 v1.0 发布工具`

## 定位

`v0.19.0` 不是新一轮大玩法扩张，而是 v1.0 前的收束工具层：把内容生产、canon schema、长测、公开检查、release art pack 和发布回滚准备做成可审计流程。

推荐玩家/制作心智：

`内容模板 -> 本地校验 -> 长测路径 -> 玩家视角走查 -> 发布前检查 -> v1.0 候选包`

## 当前权威文件

- `v0.19.0-总体开发大纲.md`
- `v0.19.0-启动审查与范围冻结.md`
- `v0.19.0-小版本执行路线图.md`
- `v0.19.0-需求决策池.md`
- `v0.19.0-真相源索引.md`
- `v0.19.0-测试矩阵.md`
- `v0.19.0-MiroFish资料需求与交付协议.md`
- `v0.19.0-Git提交与推送计划.md`

## 主目标

让 v1.0 前的新增内容、长测、发布素材、公开检查和回滚证据不再依赖聊天记忆或临时手工判断。

## 推荐小版本

| 阶段 | 主题 | 是否 runtime | MiroFish need |
|---|---|---:|---|
| a1 | 内容生产与 canon schema 设计门禁 | 否 | not_needed |
| a2 | 长测与代表性玩家路径矩阵 | 否 | preferred，可先用现有资料 |
| b1 | canon/content 校验工具第一刀 | 是，工具/脚本 | optional |
| b2 | 长测 runner 与 Player Advocate 大走查第一刀 | 是，测试/脚本 | preferred before final path wording |
| b3 | 公开前 safety preflight：hidden fact / DeepSeek / save / copy | 是，检查脚本/文档 | preferred |
| b4 | v1.0 release art pack 与公开素材候选 | 否或轻 runtime manifest | preferred/optional |
| process-1 | EdgeOne 预览 smoke 与回滚清单 | 否，流程/脚本 | not_needed |
| rc | v1.0 readiness review | 是，质量门 | no new package unless blocked |

## 明确非目标

除非用户另行批准，v0.19 不做：

- 正式 `route_entered/currentRoute/currentRegion` 持久字段。
- `SAVE_FORMAT_VERSION = 23`。
- 完整南疆地图、完整商家城、完整商会/拍卖/演武场。
- 正式阵营转移、正式任务网络、正式奖励、NPC 生死。
- 蛊仙期、宝黄天正式交易、仙蛊/仙材/尊者线。
- 大规模后端/BFF 实现、云存档、账号、自动部署。
- 新模型评估或 DeepSeek 权限扩大。
- 对外发布承诺；发布文案必须等用户最终批准。

## 当前结论

用户已批准 `v0.19.0` 作为“v1.0 readiness 工具层”。3 个 MiroFish preferred 包已交付并通过 intake review；a1/a2/b1/b2/b3/b4/process-1/rc 均已完成本地收束。下一步是按 Git 制度提交、推送、等待远端 CI，再进入 `v1.0` 启动审查与范围冻结讨论。
